"use strict";
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Primitive } from "@radix-ui/react-primitive";
import { Presence } from "@radix-ui/react-presence";
import { createContextScope } from "@radix-ui/react-context";
import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { useDirection } from "@radix-ui/react-direction";
import { useLayoutEffect } from "@radix-ui/react-use-layout-effect";
import { clamp } from "@radix-ui/number";
import { composeEventHandlers } from "@radix-ui/primitive";

// Utility Functions
function toInt(value) {
  return value ? parseInt(value, 10) : 0;
}

function getThumbRatio(viewportSize, contentSize) {
  const ratio = viewportSize / contentSize;
  return isNaN(ratio) ? 0 : ratio;
}

function getThumbSize(sizes) {
  const ratio = getThumbRatio(sizes.viewport, sizes.content);
  const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const thumbSize = (sizes.scrollbar.size - scrollbarPadding) * ratio;
  return Math.max(thumbSize, 18);
}

function getScrollPositionFromPointer(pointerPos, pointerOffset, sizes, dir = "ltr") {
  const thumbSizePx = getThumbSize(sizes);
  const thumbCenter = thumbSizePx / 2;
  const offset = pointerOffset || thumbCenter;
  const thumbOffsetFromEnd = thumbSizePx - offset;
  const minPointerPos = sizes.scrollbar.paddingStart + offset;
  const maxPointerPos = sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd;
  const maxScrollPos = sizes.content - sizes.viewport;
  const scrollRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
  const interpolate = linearScale([minPointerPos, maxPointerPos], scrollRange);
  return interpolate(pointerPos);
}

function getThumbOffsetFromScroll(scrollPos, sizes, dir = "ltr") {
  const thumbSizePx = getThumbSize(sizes);
  const scrollbarPadding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const scrollbar = sizes.scrollbar.size - scrollbarPadding;
  const maxScrollPos = sizes.content - sizes.viewport;
  const maxThumbPos = scrollbar - thumbSizePx;
  const scrollClampRange = dir === "ltr" ? [0, maxScrollPos] : [maxScrollPos * -1, 0];
  const scrollWithoutMomentum = clamp(scrollPos, scrollClampRange);
  const interpolate = linearScale([0, maxScrollPos], [0, maxThumbPos]);
  return interpolate(scrollWithoutMomentum);
}

function linearScale(input, output) {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}

function isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos) {
  return scrollPos > 0 && scrollPos < maxScrollPos;
}

function useDebounceCallback(callback, delay) {
  const handleCallback = useCallbackRef(callback);
  const debounceTimerRef = useRef(0);
  useEffect(() => () => window.clearTimeout(debounceTimerRef.current), []);
  return useCallback(() => {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(handleCallback, delay);
  }, [handleCallback, delay]);
}

function useResizeObserver(element, onResize) {
  const handleResize = useCallbackRef(onResize);
  useLayoutEffect(() => {
    let rAF = 0;
    if (element) {
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(rAF);
        rAF = window.requestAnimationFrame(handleResize);
      });
      resizeObserver.observe(element);
      return () => {
        window.cancelAnimationFrame(rAF);
        resizeObserver.unobserve(element);
      };
    }
  }, [element, handleResize]);
}

function useStateMachine(initialState, machine) {
  return React.useReducer((state, event) => {
    const nextState = machine[state][event];
    return nextState ?? state;
  }, initialState);
}

const addUnlinkedScrollListener = (node, handler = () => {}) => {
  let prevPosition = { left: node.scrollLeft, top: node.scrollTop };
  let rAF = 0;
  (function loop() {
    const position = { left: node.scrollLeft, top: node.scrollTop };
    const isHorizontalScroll = prevPosition.left !== position.left;
    const isVerticalScroll = prevPosition.top !== position.top;
    if (isHorizontalScroll || isVerticalScroll) handler();
    prevPosition = position;
    rAF = window.requestAnimationFrame(loop);
  })();
  return () => window.cancelAnimationFrame(rAF);
};

function getSubtree(options, content) {
  const { asChild, children } = options;
  if (!asChild) return typeof content === "function" ? content(children) : content;
  const firstChild = React.Children.only(children);
  return React.cloneElement(firstChild, {
    children: typeof content === "function" ? content(firstChild.props.children) : content,
  });
}

// ScrollArea Component
const SCROLL_AREA_NAME = "ScrollArea";
const [createScrollAreaContext, createScrollAreaScope] = createContextScope(SCROLL_AREA_NAME);
const [ScrollAreaProvider, useScrollAreaContext] = createScrollAreaContext(SCROLL_AREA_NAME);

const ScrollArea = React.forwardRef((props, forwardedRef) => {
  const {
    __scopeScrollArea,
    type = "hover",
    dir,
    scrollHideDelay = 600,
    ...scrollAreaProps
  } = props;
  const [scrollArea, setScrollArea] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [content, setContent] = useState(null);
  const [scrollbarX, setScrollbarX] = useState(null);
  const [scrollbarY, setScrollbarY] = useState(null);
  const [cornerWidth, setCornerWidth] = useState(0);
  const [cornerHeight, setCornerHeight] = useState(0);
  const [scrollbarXEnabled, setScrollbarXEnabled] = useState(false);
  const [scrollbarYEnabled, setScrollbarYEnabled] = useState(false);
  const composedRefs = useComposedRefs(forwardedRef, (node) => setScrollArea(node));
  const direction = useDirection(dir);

  return (
    <ScrollAreaProvider
      scope={__scopeScrollArea}
      type={type}
      dir={direction}
      scrollHideDelay={scrollHideDelay}
      scrollArea={scrollArea}
      viewport={viewport}
      onViewportChange={setViewport}
      content={content}
      onContentChange={setContent}
      scrollbarX={scrollbarX}
      onScrollbarXChange={setScrollbarX}
      scrollbarXEnabled={scrollbarXEnabled}
      onScrollbarXEnabledChange={setScrollbarXEnabled}
      scrollbarY={scrollbarY}
      onScrollbarYChange={setScrollbarY}
      scrollbarYEnabled={scrollbarYEnabled}
      onScrollbarYEnabledChange={setScrollbarYEnabled}
      onCornerWidthChange={setCornerWidth}
      onCornerHeightChange={setCornerHeight}
    >
      <Primitive.div
        dir={direction}
        {...scrollAreaProps}
        ref={composedRefs}
        style={{
          position: "relative",
          "--radix-scroll-area-corner-width": `${cornerWidth}px`,
          "--radix-scroll-area-corner-height": `${cornerHeight}px`,
          ...props.style,
        }}
      />
    </ScrollAreaProvider>
  );
});
ScrollArea.displayName = SCROLL_AREA_NAME;

// ScrollAreaViewport Component
const VIEWPORT_NAME = "ScrollAreaViewport";
const ScrollAreaViewport = React.forwardRef((props, forwardedRef) => {
  const { __scopeScrollArea, children, asChild, nonce, ...viewportProps } = props;
  const context = useScrollAreaContext(VIEWPORT_NAME, __scopeScrollArea);
  const ref = useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref, context.onViewportChange);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
[data-radix-scroll-area-viewport] {
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}
[data-radix-scroll-area-viewport]::-webkit-scrollbar {
  display: none;
}
:where([data-radix-scroll-area-viewport]) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
:where([data-radix-scroll-area-content]) {
  flex-grow: 1;
}
          `,
        }}
        nonce={nonce}
      />
      <Primitive.div
        data-radix-scroll-area-viewport=""
        {...viewportProps}
        asChild={asChild}
        ref={composedRefs}
        style={{
          overflowX: context.scrollbarXEnabled ? "scroll" : "hidden",
          overflowY: context.scrollbarYEnabled ? "scroll" : "hidden",
          ...props.style,
        }}
      >
        {getSubtree({ asChild, children }, (children2) => (
          <div
            data-radix-scroll-area-content=""
            ref={context.onContentChange}
            style={{ minWidth: context.scrollbarXEnabled ? "fit-content" : undefined }}
          >
            {children2}
          </div>
        ))}
      </Primitive.div>
    </>
  );
});
ScrollAreaViewport.displayName = VIEWPORT_NAME;

// ScrollAreaScrollbar Component
const SCROLLBAR_NAME = "ScrollAreaScrollbar";
const ScrollAreaScrollbar = React.forwardRef((props, forwardedRef) => {
  const { forceMount, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const { onScrollbarXEnabledChange, onScrollbarYEnabledChange } = context;
  const isHorizontal = props.orientation === "horizontal";

  useEffect(() => {
    isHorizontal ? onScrollbarXEnabledChange(true) : onScrollbarYEnabledChange(true);
    return () => {
      isHorizontal ? onScrollbarXEnabledChange(false) : onScrollbarYEnabledChange(false);
    };
  }, [isHorizontal, onScrollbarXEnabledChange, onScrollbarYEnabledChange]);

  switch (context.type) {
    case "hover":
      return <ScrollAreaScrollbarHover {...scrollbarProps} ref={forwardedRef} forceMount={forceMount} />;
    case "scroll":
      return <ScrollAreaScrollbarScroll {...scrollbarProps} ref={forwardedRef} forceMount={forceMount} />;
    case "auto":
      return <ScrollAreaScrollbarAuto {...scrollbarProps} ref={forwardedRef} forceMount={forceMount} />;
    case "always":
      return <ScrollAreaScrollbarVisible {...scrollbarProps} ref={forwardedRef} />;
    default:
      return null;
  }
});
ScrollAreaScrollbar.displayName = SCROLLBAR_NAME;

// ScrollAreaScrollbarHover Component
const ScrollAreaScrollbarHover = React.forwardRef((props, forwardedRef) => {
  const { forceMount, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollArea = context.scrollArea;
    let hideTimer = 0;
    if (scrollArea) {
      const handlePointerEnter = () => {
        window.clearTimeout(hideTimer);
        setVisible(true);
      };
      const handlePointerLeave = () => {
        hideTimer = window.setTimeout(() => setVisible(false), context.scrollHideDelay);
      };
      scrollArea.addEventListener("pointerenter", handlePointerEnter);
      scrollArea.addEventListener("pointerleave", handlePointerLeave);
      return () => {
        window.clearTimeout(hideTimer);
        scrollArea.removeEventListener("pointerenter", handlePointerEnter);
        scrollArea.removeEventListener("pointerleave", handlePointerLeave);
      };
    }
  }, [context.scrollArea, context.scrollHideDelay]);

  return (
    <Presence present={forceMount || visible}>
      <ScrollAreaScrollbarAuto
        data-state={visible ? "visible" : "hidden"}
        {...scrollbarProps}
        ref={forwardedRef}
      />
    </Presence>
  );
});
ScrollAreaScrollbarHover.displayName = "ScrollAreaScrollbarHover";

// ScrollAreaScrollbarScroll Component
const ScrollAreaScrollbarScroll = React.forwardRef((props, forwardedRef) => {
  const { forceMount, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const isHorizontal = props.orientation === "horizontal";
  const debounceScrollEnd = useDebounceCallback(() => send("SCROLL_END"), 100);
  const [state, send] = useStateMachine("hidden", {
    hidden: { SCROLL: "scrolling" },
    scrolling: { SCROLL_END: "idle", POINTER_ENTER: "interacting" },
    interacting: { SCROLL: "interacting", POINTER_LEAVE: "idle" },
    idle: { HIDE: "hidden", SCROLL: "scrolling", POINTER_ENTER: "interacting" },
  });

  useEffect(() => {
    if (state === "idle") {
      const hideTimer = window.setTimeout(() => send("HIDE"), context.scrollHideDelay);
      return () => window.clearTimeout(hideTimer);
    }
  }, [state, context.scrollHideDelay, send]);

  useEffect(() => {
    const viewport = context.viewport;
    const scrollDirection = isHorizontal ? "scrollLeft" : "scrollTop";
    if (viewport) {
      let prevScrollPos = viewport[scrollDirection];
      const handleScroll = () => {
        const scrollPos = viewport[scrollDirection];
        const hasScrollInDirectionChanged = prevScrollPos !== scrollPos;
        if (hasScrollInDirectionChanged) {
          send("SCROLL");
          debounceScrollEnd();
        }
        prevScrollPos = scrollPos;
      };
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [context.viewport, isHorizontal, send, debounceScrollEnd]);

  return (
    <Presence present={forceMount || state !== "hidden"}>
      <ScrollAreaScrollbarVisible
        data-state={state === "hidden" ? "hidden" : "visible"}
        {...scrollbarProps}
        ref={forwardedRef}
        onPointerEnter={composeEventHandlers(props.onPointerEnter, () => send("POINTER_ENTER"))}
        onPointerLeave={composeEventHandlers(props.onPointerLeave, () => send("POINTER_LEAVE"))}
      />
    </Presence>
  );
});
ScrollAreaScrollbarScroll.displayName = "ScrollAreaScrollbarScroll";

// ScrollAreaScrollbarAuto Component
const ScrollAreaScrollbarAuto = React.forwardRef((props, forwardedRef) => {
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const { forceMount, ...scrollbarProps } = props;
  const [visible, setVisible] = useState(false);
  const isHorizontal = props.orientation === "horizontal";
  const handleResize = useDebounceCallback(() => {
    if (context.viewport) {
      const isOverflowX = context.viewport.offsetWidth < context.viewport.scrollWidth;
      const isOverflowY = context.viewport.offsetHeight < context.viewport.scrollHeight;
      setVisible(isHorizontal ? isOverflowX : isOverflowY);
    }
  }, 10);

  useResizeObserver(context.viewport, handleResize);
  useResizeObserver(context.content, handleResize);

  return (
    <Presence present={forceMount || visible}>
      <ScrollAreaScrollbarVisible
        data-state={visible ? "visible" : "hidden"}
        {...scrollbarProps}
        ref={forwardedRef}
      />
    </Presence>
  );
});
ScrollAreaScrollbarAuto.displayName = "ScrollAreaScrollbarAuto";

// ScrollAreaScrollbarVisible Component
const ScrollAreaScrollbarVisible = React.forwardRef((props, forwardedRef) => {
  const { orientation = "vertical", ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const thumbRef = useRef(null);
  const pointerOffsetRef = useRef(0);
  const [sizes, setSizes] = useState({
    content: 0,
    viewport: 0,
    scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
  });
  const thumbRatio = getThumbRatio(sizes.viewport, sizes.content);

  const commonProps = {
    ...scrollbarProps,
    sizes,
    onSizesChange: setSizes,
    hasThumb: Boolean(thumbRatio > 0 && thumbRatio < 1),
    onThumbChange: (thumb) => (thumbRef.current = thumb),
    onThumbPointerUp: () => (pointerOffsetRef.current = 0),
    onThumbPointerDown: (pointerPos) => (pointerOffsetRef.current = pointerPos),
  };

  const getScrollPosition = (pointerPos, dir) =>
    getScrollPositionFromPointer(pointerPos, pointerOffsetRef.current, sizes, dir);

  if (orientation === "horizontal") {
    return (
      <ScrollAreaScrollbarX
        {...commonProps}
        ref={forwardedRef}
        onThumbPositionChange={() => {
          if (context.viewport && thumbRef.current) {
            const scrollPos = context.viewport.scrollLeft;
            const offset = getThumbOffsetFromScroll(scrollPos, sizes, context.dir);
            thumbRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
          }
        }}
        onWheelScroll={(scrollPos) => {
          if (context.viewport) context.viewport.scrollLeft = scrollPos;
        }}
        onDragScroll={(pointerPos) => {
          if (context.viewport) context.viewport.scrollLeft = getScrollPosition(pointerPos, context.dir);
        }}
      />
    );
  }

  if (orientation === "vertical") {
    return (
      <ScrollAreaScrollbarY
        {...commonProps}
        ref={forwardedRef}
        onThumbPositionChange={() => {
          if (context.viewport && thumbRef.current) {
            const scrollPos = context.viewport.scrollTop;
            const offset = getThumbOffsetFromScroll(scrollPos, sizes);
            thumbRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
          }
        }}
        onWheelScroll={(scrollPos) => {
          if (context.viewport) context.viewport.scrollTop = scrollPos;
        }}
        onDragScroll={(pointerPos) => {
          if (context.viewport) context.viewport.scrollTop = getScrollPosition(pointerPos);
        }}
      />
    );
  }

  return null;
});
ScrollAreaScrollbarVisible.displayName = "ScrollAreaScrollbarVisible";

// ScrollAreaScrollbarX Component
const ScrollAreaScrollbarX = React.forwardRef((props, forwardedRef) => {
  const { sizes, onSizesChange, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const [computedStyle, setComputedStyle] = useState();
  const ref = useRef(null);
  const composeRefs = useComposedRefs(forwardedRef, ref, context.onScrollbarXChange);

  useEffect(() => {
    if (ref.current) setComputedStyle(getComputedStyle(ref.current));
  }, [ref]);

  return (
    <ScrollAreaScrollbarImpl
      data-orientation="horizontal"
      {...scrollbarProps}
      ref={composeRefs}
      sizes={sizes}
      style={{
        bottom: 0,
        left: context.dir === "rtl" ? "var(--radix-scroll-area-corner-width)" : 0,
        right: context.dir === "ltr" ? "var(--radix-scroll-area-corner-width)" : 0,
        "--radix-scroll-area-thumb-width": `${getThumbSize(sizes)}px`,
        ...props.style,
      }}
      onThumbPointerDown={(pointerPos) => props.onThumbPointerDown(pointerPos.x)}
      onDragScroll={(pointerPos) => props.onDragScroll(pointerPos.x)}
      onWheelScroll={(event, maxScrollPos) => {
        if (context.viewport) {
          const scrollPos = context.viewport.scrollLeft + event.deltaX;
          props.onWheelScroll(scrollPos);
          if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) event.preventDefault();
        }
      }}
      onResize={() => {
        if (ref.current && context.viewport && computedStyle) {
          onSizesChange({
            content: context.viewport.scrollWidth,
            viewport: context.viewport.offsetWidth,
            scrollbar: {
              size: ref.current.clientWidth,
              paddingStart: toInt(computedStyle.paddingLeft),
              paddingEnd: toInt(computedStyle.paddingRight),
            },
          });
        }
      }}
    />
  );
});
ScrollAreaScrollbarX.displayName = "ScrollAreaScrollbarX";

// ScrollAreaScrollbarY Component
const ScrollAreaScrollbarY = React.forwardRef((props, forwardedRef) => {
  const { sizes, onSizesChange, ...scrollbarProps } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, props.__scopeScrollArea);
  const [computedStyle, setComputedStyle] = useState();
  const ref = useRef(null);
  const composeRefs = useComposedRefs(forwardedRef, ref, context.onScrollbarYChange);

  useEffect(() => {
    if (ref.current) setComputedStyle(getComputedStyle(ref.current));
  }, [ref]);

  return (
    <ScrollAreaScrollbarImpl
      data-orientation="vertical"
      {...scrollbarProps}
      ref={composeRefs}
      sizes={sizes}
      style={{
        top: 0,
        right: context.dir === "ltr" ? 0 : undefined,
        left: context.dir === "rtl" ? 0 : undefined,
        bottom: "var(--radix-scroll-area-corner-height)",
        "--radix-scroll-area-thumb-height": `${getThumbSize(sizes)}px`,
        ...props.style,
      }}
      onThumbPointerDown={(pointerPos) => props.onThumbPointerDown(pointerPos.y)}
      onDragScroll={(pointerPos) => props.onDragScroll(pointerPos.y)}
      onWheelScroll={(event, maxScrollPos) => {
        if (context.viewport) {
          const scrollPos = context.viewport.scrollTop + event.deltaY;
          props.onWheelScroll(scrollPos);
          if (isScrollingWithinScrollbarBounds(scrollPos, maxScrollPos)) event.preventDefault();
        }
      }}
      onResize={() => {
        if (ref.current && context.viewport && computedStyle) {
          onSizesChange({
            content: context.viewport.scrollHeight,
            viewport: context.viewport.offsetHeight,
            scrollbar: {
              size: ref.current.clientHeight,
              paddingStart: toInt(computedStyle.paddingTop),
              paddingEnd: toInt(computedStyle.paddingBottom),
            },
          });
        }
      }}
    />
  );
});
ScrollAreaScrollbarY.displayName = "ScrollAreaScrollbarY";

// ScrollAreaScrollbarImpl Component
const [ScrollbarProvider, useScrollbarContext] = createScrollAreaContext(SCROLLBAR_NAME);
const ScrollAreaScrollbarImpl = React.forwardRef((props, forwardedRef) => {
  const {
    __scopeScrollArea,
    sizes,
    hasThumb,
    onThumbChange,
    onThumbPointerUp,
    onThumbPointerDown,
    onThumbPositionChange,
    onDragScroll,
    onWheelScroll,
    onResize,
    ...scrollbarProps
  } = props;
  const context = useScrollAreaContext(SCROLLBAR_NAME, __scopeScrollArea);
  const [scrollbar, setScrollbar] = useState(null);
  const composeRefs = useComposedRefs(forwardedRef, (node) => setScrollbar(node));
  const rectRef = useRef(null);
  const prevWebkitUserSelectRef = useRef("");
  const viewport = context.viewport;
  const maxScrollPos = sizes.content - sizes.viewport;
  const handleWheelScroll = useCallbackRef(onWheelScroll);
  const handleThumbPositionChange = useCallbackRef(onThumbPositionChange);
  const handleResize = useDebounceCallback(onResize, 10);

  const handleDragScroll = (event) => {
    if (rectRef.current) {
      const x = event.clientX - rectRef.current.left;
      const y = event.clientY - rectRef.current.top;
      onDragScroll({ x, y });
    }
  };

  useEffect(() => {
    const handleWheel = (event) => {
      const element = event.target;
      const isScrollbarWheel = scrollbar?.contains(element);
      if (isScrollbarWheel) handleWheelScroll(event, maxScrollPos);
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, [viewport, scrollbar, maxScrollPos, handleWheelScroll]);

  useEffect(() => {
    handleThumbPositionChange();
  }, [sizes, handleThumbPositionChange]);

  useResizeObserver(scrollbar, handleResize);
  useResizeObserver(context.content, handleResize);

  return (
    <ScrollbarProvider
      scope={__scopeScrollArea}
      scrollbar={scrollbar}
      hasThumb={hasThumb}
      onThumbChange={useCallbackRef(onThumbChange)}
      onThumbPointerUp={useCallbackRef(onThumbPointerUp)}
      onThumbPositionChange={handleThumbPositionChange}
      onThumbPointerDown={useCallbackRef(onThumbPointerDown)}
    >
      <Primitive.div
        {...scrollbarProps}
        ref={composeRefs}
        style={{ position: "absolute", ...scrollbarProps.style }}
        onPointerDown={composeEventHandlers(props.onPointerDown, (event) => {
          const mainPointer = 0;
          if (event.button === mainPointer) {
            const element = event.target;
            element.setPointerCapture(event.pointerId);
            rectRef.current = scrollbar.getBoundingClientRect();
            prevWebkitUserSelectRef.current = document.body.style.webkitUserSelect;
            document.body.style.webkitUserSelect = "none";
            if (context.viewport) context.viewport.style.scrollBehavior = "auto";
            handleDragScroll(event);
          }
        })}
        onPointerMove={composeEventHandlers(props.onPointerMove, handleDragScroll)}
        onPointerUp={composeEventHandlers(props.onPointerUp, (event) => {
          const element = event.target;
          if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
          }
          document.body.style.webkitUserSelect = prevWebkitUserSelectRef.current;
          if (context.viewport) context.viewport.style.scrollBehavior = "";
          rectRef.current = null;
        })}
      />
    </ScrollbarProvider>
  );
});
ScrollAreaScrollbarImpl.displayName = "ScrollAreaScrollbarImpl";

// ScrollAreaThumb Component
const THUMB_NAME = "ScrollAreaThumb";
const ScrollAreaThumb = React.forwardRef((props, forwardedRef) => {
  const { forceMount, ...thumbProps } = props;
  const scrollbarContext = useScrollbarContext(THUMB_NAME, props.__scopeScrollArea);

  return (
    <Presence present={forceMount || scrollbarContext.hasThumb}>
      <ScrollAreaThumbImpl ref={forwardedRef} {...thumbProps} />
    </Presence>
  );
});
ScrollAreaThumb.displayName = THUMB_NAME;

const ScrollAreaThumbImpl = React.forwardRef((props, forwardedRef) => {
  const { __scopeScrollArea, style, ...thumbProps } = props;
  const scrollAreaContext = useScrollAreaContext(THUMB_NAME, __scopeScrollArea);
  const scrollbarContext = useScrollbarContext(THUMB_NAME, __scopeScrollArea);
  const { onThumbPositionChange } = scrollbarContext;
  const composedRef = useComposedRefs(forwardedRef, (node) => scrollbarContext.onThumbChange(node));
  const removeUnlinkedScrollListenerRef = useRef();
  const debounceScrollEnd = useDebounceCallback(() => {
    if (removeUnlinkedScrollListenerRef.current) {
      removeUnlinkedScrollListenerRef.current();
      removeUnlinkedScrollListenerRef.current = undefined;
    }
  }, 100);

  useEffect(() => {
    const viewport = scrollAreaContext.viewport;
    if (viewport) {
      const handleScroll = () => {
        debounceScrollEnd();
        if (!removeUnlinkedScrollListenerRef.current) {
          const listener = addUnlinkedScrollListener(viewport, onThumbPositionChange);
          removeUnlinkedScrollListenerRef.current = listener;
          onThumbPositionChange();
        }
      };
      onThumbPositionChange();
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [scrollAreaContext.viewport, debounceScrollEnd, onThumbPositionChange]);

  return (
    <Primitive.div
      data-state={scrollbarContext.hasThumb ? "visible" : "hidden"}
      {...thumbProps}
      ref={composedRef}
      style={{
        width: "var(--radix-scroll-area-thumb-width)",
        height: "var(--radix-scroll-area-thumb-height)",
        ...style,
      }}
      onPointerDownCapture={composeEventHandlers(props.onPointerDownCapture, (event) => {
        const thumb = event.target;
        const thumbRect = thumb.getBoundingClientRect();
        const x = event.clientX - thumbRect.left;
        const y = event.clientY - thumbRect.top;
        scrollbarContext.onThumbPointerDown({ x, y });
      })}
      onPointerUp={composeEventHandlers(props.onPointerUp, scrollbarContext.onThumbPointerUp)}
    />
  );
});
ScrollAreaThumbImpl.displayName = "ScrollAreaThumbImpl";

// ScrollAreaCorner Component
const CORNER_NAME = "ScrollAreaCorner";
const ScrollAreaCorner = React.forwardRef((props, forwardedRef) => {
  const context = useScrollAreaContext(CORNER_NAME, props.__scopeScrollArea);
  const hasBothScrollbarsVisible = Boolean(context.scrollbarX && context.scrollbarY);
  const hasCorner = context.type !== "scroll" && hasBothScrollbarsVisible;

  return hasCorner ? <ScrollAreaCornerImpl {...props} ref={forwardedRef} /> : null;
});
ScrollAreaCorner.displayName = CORNER_NAME;

const ScrollAreaCornerImpl = React.forwardRef((props, forwardedRef) => {
  const { __scopeScrollArea, ...cornerProps } = props;
  const context = useScrollAreaContext(CORNER_NAME, __scopeScrollArea);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const hasSize = Boolean(width && height);

  useResizeObserver(context.scrollbarX, () => {
    const height2 = context.scrollbarX?.offsetHeight || 0;
    context.onCornerHeightChange(height2);
    setHeight(height2);
  });

  useResizeObserver(context.scrollbarY, () => {
    const width2 = context.scrollbarY?.offsetWidth || 0;
    context.onCornerWidthChange(width2);
    setWidth(width2);
  });

  return hasSize ? (
    <Primitive.div
      {...cornerProps}
      ref={forwardedRef}
      style={{
        width,
        height,
        position: "absolute",
        right: context.dir === "ltr" ? 0 : undefined,
        left: context.dir === "rtl" ? 0 : undefined,
        bottom: 0,
        ...props.style,
      }}
    />
  ) : null;
});
ScrollAreaCornerImpl.displayName = "ScrollAreaCornerImpl";

// Aliases for Exports
const Root = ScrollArea;
const Viewport = ScrollAreaViewport;
const Scrollbar = ScrollAreaScrollbar;
const Thumb = ScrollAreaThumb;
const Corner = ScrollAreaCorner;

// Exports
export {
  Corner,
  Root,
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  Scrollbar,
  Thumb,
  Viewport,
  createScrollAreaScope,
};