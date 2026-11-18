import homeIcon from "@/assets/images/back-icon.png";
import vipIcon from "@/assets/images/vip-icon.png";
import addIcon from "@/assets/images/add-icon.png";
import coinIcon from "@/assets/images/coin-icon.png";
import { fmtMoney, fmtPeso } from "@/utils/format";
import { FitWidthText } from "@/components/FitWidthText";
import "./index.scss";

export interface LobbyHeaderProps {
  onHome?: () => void;
  balance?: string | number;
  tickets?: string | number;
  onAddBalance?: () => void;
  /** Activity 等子页用设计稿返回钮；默认大厅 `back-icon` */
  backIcon?: string;
  className?: string;
}

export function LobbyHeader({
  onHome,
  balance = 99986389,
  tickets = 1087499,
  onAddBalance,
  backIcon = homeIcon,
  className,
}: LobbyHeaderProps) {
  return (
    <header className={`lobby-header${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="lobby-header__left is-click"
        onClick={onHome}
        aria-label="返回"
      >
        <img src={backIcon} alt="" draggable={false} />
      </button>

      <div className="lobby-header__center">
        <div className="user-info">
          <div className="user-info__avatar"></div>
          <div className="user-info__name">
            <span className="user-info__name-text">{`JuanPlayer`}</span>
            <div className="user-info__name-vip">
              <div className="user-info__name-vip-icon">
                <img src={vipIcon} alt="VIP" />
              </div>
              {`VIP 3`}
            </div>
          </div>
        </div>
        <div className="lobby-header__wallet">
          <div className="lobby-header__pill lobby-header__pill--balance">
            <FitWidthText
              className="lobby-header__pill-value fit-width-text"
              text={fmtPeso(balance)}
              maxFontSize={16}
              minFontSize={10}
            />
            <button
              type="button"
              className="lobby-header__pill-add is-click"
              onClick={onAddBalance}
              aria-label="充值"
            >
              <img src={addIcon} alt="" />
            </button>
          </div>
          <div className="lobby-header__pill lobby-header__pill--tickets">
            <img className="lobby-header__pill-coin" src={coinIcon} alt="" />
            <FitWidthText
              className="lobby-header__pill-value fit-width-text"
              text={fmtMoney(tickets)}
              maxFontSize={16}
              minFontSize={10}
            />
          </div>
        </div>
      </div>

      <span className="lobby-header__left lobby-header__left--spacer" aria-hidden />
    </header>
  );
}