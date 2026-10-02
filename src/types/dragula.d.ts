declare module 'dragula' {
  interface DragulaOptions {
    containers?: Element[];
    isContainer?: (el: Element) => boolean;
    moves?: (el?: Element, source?: Element, handle?: Element, sibling?: Element) => boolean;
    accepts?: (el?: Element, target?: Element, source?: Element, sibling?: Element) => boolean;
    invalid?: (el?: Element, handle?: Element) => boolean;
    direction?: 'vertical' | 'horizontal';
    copy?: boolean | ((el: Element, source: Element) => boolean);
    copySortSource?: boolean;
    revertOnSpill?: boolean;
    removeOnSpill?: boolean;
    mirrorContainer?: Element;
    ignoreInputTextSelection?: boolean;
    slideFactorX?: number;
    slideFactorY?: number;
  }

  interface Drake {
    containers: Element[];
    dragging: boolean;
    start(item: Element): void;
    end(): void;
    cancel(revert?: boolean): void;
    canMove(item: Element): boolean;
    remove(): void;
    on(event: string, listener: (...args: any[]) => void): Drake;
    destroy(): void;
  }

  function dragula(containers?: Element[], options?: DragulaOptions): Drake;
  export = dragula;
}
