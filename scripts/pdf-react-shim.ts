/**
 * tsx で @react-pdf を直接実行するとき、src 内の JSX が参照する React をグローバルに供給する。
 * このファイルを他の pdf スクリプトより先に import すること。
 */
import * as React from "react";

(globalThis as unknown as { React: typeof React }).React = React;
