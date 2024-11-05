"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface CursorData {
  userId: string;
  line: number;
  character: number;
  color: string;
}

interface MouseData {
  userId: string;
  x: number;
  y: number;
  color: string;
}

interface ContentChange {
  userId: string;
  content: string;
  selection: {
    start: number;
    end: number;
  };
}

function TextEditor() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [cursorPositions, setCursorPositions] = useState<Record<string, CursorData>>({});
  const [mousePositions, setMousePositions] = useState<Record<string, MouseData>>({});
  const [isTyping, setIsTyping] = useState(false);
  const lastSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const { socket, isConnected } = useSocket();

  const preserveSelection = () => {
    if (!window.getSelection || !editorRef.current) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    return {
      start: getTextOffset(editorRef.current, range.startContainer, range.startOffset),
      end: getTextOffset(editorRef.current, range.endContainer, range.endOffset)
    };
  };

  const restoreSelection = (selection: { start: number; end: number }) => {
    if (!editorRef.current) return;

    const root = editorRef.current;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let startNode, startNodeOffset, endNode, endNodeOffset;

    let node = walker.nextNode();
    while (node) {
      const nodeLength = node.textContent?.length || 0;

      if (!startNode && currentOffset + nodeLength >= selection.start) {
        startNode = node;
        startNodeOffset = selection.start - currentOffset;
      }

      if (!endNode && currentOffset + nodeLength >= selection.end) {
        endNode = node;
        endNodeOffset = selection.end - currentOffset;
        break;
      }

      currentOffset += nodeLength;
      node = walker.nextNode();
    }

    if (startNode && endNode && typeof startNodeOffset === 'number' && typeof endNodeOffset === 'number') {
      const range = document.createRange();
      range.setStart(startNode, startNodeOffset);
      range.setEnd(endNode, endNodeOffset);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const getTextOffset = (root: Node, node: Node, offset: number): number => {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );

    let totalOffset = 0;
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode === node) {
        return totalOffset + offset;
      }
      totalOffset += currentNode.textContent?.length || 0;
      currentNode = walker.nextNode();
    }

    return totalOffset;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current || !socket) return;

    const editorRect = editorRef.current.getBoundingClientRect();
    const mouseData: MouseData = {
      userId: socket.id,
      x: e.clientX - editorRect.left,
      y: e.clientY - editorRect.top,
      color: "blue",
    };
    socket.emit("mouse-move", mouseData);
  };

  const handleKeyUp = () => {
    if (!window.getSelection || !editorRef.current || !socket) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const line = Array.from(editorRef.current.childNodes).indexOf(range.startContainer);
    const character = range.startOffset;

    const cursorData: CursorData = {
      userId: socket.id,
      line,
      character,
      color: "blue",
    };
    socket.emit("cursor-move", cursorData);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!socket || !editorRef.current) return;

    const selection = preserveSelection();
    if (selection) {
      lastSelectionRef.current = selection;
    }

    const contentChange: ContentChange = {
      userId: socket.id,
      content: editorRef.current.innerText,
      selection: selection || { start: 0, end: 0 }
    };

    setIsTyping(true);
    socket.emit("content-change", contentChange);

    // Reset typing status after a delay
    setTimeout(() => setIsTyping(false), 500);
  };

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("cursor-move", (cursorData: CursorData) => {
        if (cursorData.userId !== socket.id) {
          setCursorPositions((prev) => ({ ...prev, [cursorData.userId]: cursorData }));
        }
      });

      socket.on("mouse-move", (mouseData: MouseData) => {
        if (mouseData.userId !== socket.id) {
          setMousePositions((prev) => ({ ...prev, [mouseData.userId]: mouseData }));
        }
      });

      socket.on("content-change", (change: ContentChange) => {
        if (change.userId !== socket.id && editorRef.current && !isTyping) {
          const currentSelection = preserveSelection();
          
          editorRef.current.innerText = change.content;
          
          if (currentSelection) {
            restoreSelection(currentSelection);
          }
        }
      });

      return () => {
        socket.off("cursor-move");
        socket.off("mouse-move");
        socket.off("content-change");
      };
    }
  }, [socket, isConnected, isTyping]);

  return (
    <div className="editor-container" style={{ position: "relative" }}>
      <div
        ref={editorRef}
        className="text-editor"
        contentEditable
        onInput={handleInput}
        onMouseMove={handleMouseMove}
        onKeyUp={handleKeyUp}
        suppressContentEditableWarning
        style={{
          position: "relative",
          width: "100%",
          height: "300px",
          border: "1px solid #ccc",
          padding: "8px",
          whiteSpace: "pre-wrap",
        }}
      >
        This is a collaborative editor. Watch cursors and mouse movements!
      </div>

      {Object.values(cursorPositions).map((cursor) => (
        <Cursor key={cursor.userId} {...cursor} editorRef={editorRef} />
      ))}

      {Object.values(mousePositions).map((mouse) => (
        <MouseIndicator key={mouse.userId} {...mouse} editorRef={editorRef} />
      ))}
    </div>
  );
}

// Cursor and MouseIndicator components remain the same
interface CursorProps extends CursorData {
  editorRef: React.RefObject<HTMLDivElement>;
}

function Cursor({ line, character, color, editorRef }: CursorProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && cursorRef.current) {
      const range = document.createRange();
      const lineNode = editorRef.current.childNodes[line] as ChildNode | null;

      if (lineNode && lineNode.textContent) {
        range.setStart(lineNode, Math.min(character, lineNode.textContent.length));
        range.collapse(true);

        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();

        cursorRef.current.style.position = "absolute";
        cursorRef.current.style.top = `${rect.top - editorRect.top}px`;
        cursorRef.current.style.left = `${rect.left - editorRect.left}px`;
      }
    }
  }, [line, character, editorRef]);

  return (
    <div
      ref={cursorRef}
      className="cursor"
      style={{
        borderLeft: `2px solid ${color}`,
        height: "1em",
        position: "absolute",
        zIndex: 10,
      }}
    />
  );
}

interface MouseIndicatorProps extends MouseData {
  editorRef: React.RefObject<HTMLDivElement>;
}

function MouseIndicator({ x, y, color, userId, editorRef }: MouseIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && indicatorRef.current) {
      indicatorRef.current.style.position = "absolute";
      indicatorRef.current.style.top = `${y}px`;
      indicatorRef.current.style.left = `${x}px`;
    }
  }, [x, y, editorRef]);

  return (
    <div
      ref={indicatorRef}
      className="mouse-indicator"
      style={{
        backgroundColor: color,
        borderRadius: "50%",
        width: "8px",
        height: "8px",
        position: "absolute",
        zIndex: 10,
      }}
    >
      <span style={{ fontSize: "0.8em", color: color }}>{userId}</span>
    </div>
  );
}

export default TextEditor;