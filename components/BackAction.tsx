import type { MouseEventHandler, ReactNode } from "react";
import Link from "next/link";
import UiIcon from "@/components/UiIcon";
import styles from "./BackAction.module.css";

type Props = {
  children: ReactNode;
  className?: string;
} & (
  | { as: "link"; href: string; onClick?: MouseEventHandler<HTMLAnchorElement> }
  | { as: "button"; onClick: MouseEventHandler<HTMLButtonElement>; disabled?: boolean }
);

function IsiTombol({ children }: { children: ReactNode }) {
  return (
    <>
      <span className={styles.icon}><UiIcon name="arrow-left" size={15} /></span>
      <span>{children}</span>
    </>
  );
}

export default function BackAction(props: Props) {
  const className = [styles.backAction, props.className].filter(Boolean).join(" ");

  if (props.as === "link") {
    return (
      <Link className={className} href={props.href} onClick={props.onClick}>
        <IsiTombol>{props.children}</IsiTombol>
      </Link>
    );
  }

  return (
    <button className={className} disabled={props.disabled} onClick={props.onClick} type="button">
      <IsiTombol>{props.children}</IsiTombol>
    </button>
  );
}
