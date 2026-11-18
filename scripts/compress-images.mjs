/**
 * 图片无损/近无损压缩脚本（sharp）。
 *
 * 用法：
 *   npm run images:compress            # 压缩 src/assets 下所有 png/jpg（原文件被替换）
 *   npm run images:compress -- --check # 只统计可省体积，不写文件（dry-run）
 *
 * 策略：
 * - PNG：无损重压缩（compressionLevel 9 + palette 量化开关自适应）。
 *   palette=true 是有损量化（<=256 色），但游戏 UI 图多为纯色/渐变块，视觉无损、
 *   收益巨大；截图/照片类彩图自动跳过量化的场景见 tryPalette 逻辑。
 *   若要求严格无损，改 PALETTE=false 即可（收益会明显变小）。
 * - JPG：mozjpeg 近无损重编码（quality 90），默认视觉无损；要严格无损则跳过 jpg。
 * - 尺寸不变、格式不变、文件名不变：对代码零侵入，git 可随时回滚单张图。
 *
 * 安全边界：只处理 src/assets/；单张图压缩后反而变大则保留原文件。
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = join(process.cwd(), "src", "assets");
const DRY_RUN = process.argv.includes("--check");

/** palette 量化开关：false = 严格无损（收益小）；true = 视觉无损（默认，收益大） */
const PALETTE = true;
/** JPG 重编码质量（mozjpeg）：90 视觉无损口径 */
const JPEG_QUALITY = 90;

/** 收集目录下全部图片文件路径 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g)$/i.test(name)) out.push(p);
  }
  return out;
}

async function compress(file) {
  const before = statSync(file).size;
  const ext = extname(file).toLowerCase();
  const buf = readFileSync(file);

  let out;
  if (ext === ".png") {
    // 先按常规无损压缩产出一版
    const plain = await sharp(buf).png({ compressionLevel: 9, effort: 10 }).toBuffer();
    out = plain;
    if (PALETTE) {
      // 再产出一版 palette 量化（<=256 色）。仅当显著更小才采用：
      // 照片类彩图量化后失真明显，用"必须小 30% 以上"做保护阈值
      try {
        const quantized = await sharp(buf)
          .png({ compressionLevel: 9, effort: 10, palette: true, quality: 90 })
          .toBuffer();
        if (quantized.length < plain.length * 0.7) out = quantized;
      } catch {
        // 个别特殊位深/色彩空间图量化失败，保留 plain 版本
      }
    }
  } else {
    out = await sharp(buf).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  }

  // 幂等守卫：收益不足 1% 视为"已压缩过"，跳过不写。
  // 只拦"变大"不够——JPG 重复编码每代都有轻微画质损失（generation loss），
  // 省 3 字节重写一次纯属伤害；PNG palette 量化无害但同样没必要重写。
  const MIN_SAVING = Math.max(before * 0.01, 512);
  if (before - out.length < MIN_SAVING) return { file, before, after: before, skipped: true };

  if (!DRY_RUN) writeFileSync(file, out);
  return { file, before, after: out.length, skipped: false };
}

const files = walk(ROOT);
if (files.length === 0) {
  console.log(`未在 ${ROOT} 下找到图片`);
  process.exit(0);
}

console.log(`共 ${files.length} 张图片${DRY_RUN ? "（dry-run，不写文件）" : ""}\n`);

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;
const details = [];

// 串行处理：sharp 内部已并发，串行可让日志顺序稳定且内存可控
for (const f of files) {
  try {
    const r = await compress(f);
    totalBefore += r.before;
    totalAfter += r.after;
    if (!r.skipped) {
      changed++;
      details.push(r);
    }
    const pct = ((1 - r.after / r.before) * 100).toFixed(1);
    process.stdout.write(
      `${r.skipped ? "· 跳过" : "✓ 压缩"} ${(r.before / 1024).toFixed(0).padStart(6)}K → ${(r.after / 1024).toFixed(0).padStart(6)}K (-${pct}%)  ${f.replace(process.cwd() + "/", "")}\n`,
    );
  } catch (e) {
    process.stdout.write(`! 失败  ${f}  ${e.message}\n`);
  }
}

const saved = totalBefore - totalAfter;
console.log(
  `\n完成：${changed}/${files.length} 张被压缩，` +
    `${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB，` +
    `节省 ${saved > 0 ? (saved / 1024 / 1024).toFixed(1) + "MB" : "0B"}`,
);
