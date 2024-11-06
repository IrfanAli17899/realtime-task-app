"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useSocket } from "@/hooks";
import { Tasks } from "@/actions";
import { Avatar, Tooltip, Typography } from "antd";
import { useSession } from "next-auth/react";
import useThrottle from "@/hooks/useThrottle";

interface UserIndicator {
  userId: string;
  color: string;
  timestamp: number;
  type: "cursor" | "mouse";
  position?: number;
  x?: number;
  y?: number;
}

interface ContentUpdate {
  userId: string;
  content: string;
  changeType: "insert" | "delete";
  changeStart: number;
  changeLength: number;
  cursorPosition: number;
  timestamp: number;
}

const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#FF33F5"];
const THROTTLE_MS = 50;
const MOUSE_TIMEOUT = 1000;

function getCursorPosition(element: HTMLElement): {
  position: number;
  rect?: DOMRect | null;
} {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return { position: 0, rect: null };

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return {
    position: preCaretRange.toString().length,
    rect: range.getBoundingClientRect(),
  };
}

function TaskScreen({ task }: { task: Tasks[0] }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout>();
  const localCursorRef = useRef<number>(0);
  const contentRef = useRef(task.description || "Start typing...");
  const [userIndicators, setUserIndicators] = useState<
    Record<string, UserIndicator>
  >({});
  const { socket } = useSocket();
  const { data: session } = useSession();
  const userColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const isUpdatingRef = useRef(false);
  const userId = session?.user?.id;
  const [activeUsers, setActiveUsers] = useState(new Set());

  const userMap = useMemo(() => {
    const map = new Map();
    [...task.assignments, { user: task.user }].forEach(({ user }) =>
      map.set(user.id, user)
    );
    return map;
  }, [task]);

  const setCursorPosition = useCallback(
    (element: HTMLElement, position: number) => {
      const textNode = element.firstChild || element;
      const selection = window.getSelection();
      const range = document.createRange();

      try {
        const offset = Math.min(position, textNode.textContent?.length || 0);
        range.setStart(textNode, offset);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        localCursorRef.current = position;
      } catch (error) {
        console.error("Error setting cursor position:", error);
      }
    },
    []
  );

  const updateCursorPosition = useCallback(() => {
    if (!socket || !userId || !task.id || !editorRef.current) return;

    const { position, rect } = getCursorPosition(editorRef.current);
    if (!rect) return;

    localCursorRef.current = position;
    const editorRect = editorRef.current.getBoundingClientRect();
    const indicatorData: UserIndicator = {
      userId,
      color: userColor.current,
      timestamp: Date.now(),
      type: "cursor",
      position,
      x: rect.left - editorRect.left,
      y: rect.top - editorRect.top,
    };

    socket.emit("task:indicator-update", task.id, indicatorData);
  }, [socket, userId, task.id]);

  const handleCursor = useThrottle(updateCursorPosition, THROTTLE_MS);

  const handleMouse = useThrottle((e: React.MouseEvent<HTMLDivElement>) => {
    if (!socket || !userId || !task.id || !editorRef.current) return;

    clearTimeout(mouseTimeoutRef.current);

    const editorRect = editorRef.current.getBoundingClientRect();
    const indicatorData: UserIndicator = {
      userId,
      color: userColor.current,
      timestamp: Date.now(),
      type: "mouse",
      x: e.clientX - editorRect.left,
      y: e.clientY - editorRect.top,
    };

    socket.emit("task:indicator-update", task.id, indicatorData);

    mouseTimeoutRef.current = setTimeout(updateCursorPosition, MOUSE_TIMEOUT);
  }, THROTTLE_MS);

  const handleInputCallback = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (
        !socket ||
        !userId ||
        !task.id ||
        !editorRef.current ||
        isUpdatingRef.current
      )
        return;

      const content = (e.target as HTMLDivElement).innerText;
      const { position } = getCursorPosition(editorRef.current);

      const changeStart = localCursorRef.current;
      const changeLength = Math.abs(content.length - contentRef.current.length);
      const changeType =
        content.length > contentRef.current.length ? "insert" : "delete";

      localCursorRef.current = position;
      contentRef.current = content;

      const update: ContentUpdate = {
        userId,
        content,
        changeType,
        changeStart,
        changeLength,
        cursorPosition: position,
        timestamp: Date.now(),
      };

      socket.emit("task:content-change", task.id, update);
      //   updateTaskAction({id: task.id, description: task.description})
      handleCursor();
    },
    [socket, userId, task.id, handleCursor]
  );

  const handleInput = useThrottle(handleInputCallback, THROTTLE_MS);

  const handleUserJoin = (userId: string, type: "add" | "delete") => {
    console.log("userId", userId);

    setActiveUsers((prv) => {
      console.log(prv);

      if (type === "add") prv.add(userId);
      else prv.delete(userId);
      return new Set([...prv]);
    });
  };

  const handleIndicatorUpdate = useCallback(
    (data: UserIndicator) => {
      if (data.userId !== userId) {
        setUserIndicators((prev) => ({ ...prev, [data.userId]: data }));
      }
    },
    [userId]
  );

  const handleContentChange = useCallback(
    (update: ContentUpdate) => {
      if (update.userId !== userId && editorRef.current) {
        isUpdatingRef.current = true;

        const { changeStart, changeLength, changeType, content } = update;

        let updatedCursor = localCursorRef.current;

        if (changeType === "insert") {
          if (changeStart < updatedCursor) {
            updatedCursor += changeLength;
          }
        } else if (changeType === "delete") {
          if (changeStart < updatedCursor) {
            updatedCursor -= Math.min(
              changeLength,
              updatedCursor - changeStart
            );
          }
        }

        // Update content
        editorRef.current.innerText = content;
        contentRef.current = content;

        // Restore local cursor position
        setCursorPosition(editorRef.current, updatedCursor);

        isUpdatingRef.current = false;
      }
    },
    [userId, setCursorPosition]
  );

  useEffect(() => {
    if (!socket || !task.id) return;
    socket.emit("task:join", task.id, session?.user?.id);
    return () => {
      socket.emit("task:leave", task.id, session?.user?.id);
    };
  }, [socket, task.id]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!mouseTimeoutRef.current && editorRef.current) {
        const { position } = getCursorPosition(editorRef.current);
        localCursorRef.current = position;
        handleCursor();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      clearTimeout(mouseTimeoutRef.current);
    };
  }, [handleCursor]);

  useEffect(() => {
    if (!socket || !userId || !task.id) return;

    socket.on(`task:${task.id}:indicator-update`, handleIndicatorUpdate);
    socket.on(`task:${task.id}:content-change`, handleContentChange);
    socket.on(`task:${task.id}:user-join`, (userId) =>
      handleUserJoin(userId, "add")
    );
    socket.on(`task:${task.id}:user-leave`, (userId) =>
      handleUserJoin(userId, "delete")
    );

    return () => {
      socket.off(`task:${task.id}:indicator-update`);
      socket.off(`task:${task.id}:content-change`);
      socket.off(`task:${task.id}:user-join`);
      socket.off(`task:${task.id}:user-leave`);
    };
  }, [socket, userId, task.id, handleIndicatorUpdate, handleContentChange]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = contentRef.current;
    }
  }, []);

  return (
    <div className="relative w-full min-h-[300px] p-4">
      <div className="flex justify-between">
        <Typography.Title level={3} className="mb-4">
          {task.title}
        </Typography.Title>
        <Avatar.Group>
          {[...task.assignments, { user: task.user }].map(
            ({ user }) => (
              <Tooltip key={user?.id} title={user?.name} placement="top">
                <Avatar
                  style={{ opacity: activeUsers.has(user.id) ? 1 : 0.5 }}
                  src={user?.image}
                />
              </Tooltip>
            ),
            []
          )}
        </Avatar.Group>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          className="w-full min-h-[200px] p-2 border rounded-lg"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onMouseMove={handleMouse}
        />

        {Object.values(userIndicators).map((indicator) => (
          <Tooltip
            key={indicator.userId}
            title={userMap.get(indicator.userId)?.name}
            placement="top"
          >
            <div
              className="absolute"
              style={{
                left: `${indicator.x}px`,
                top: `${indicator.y}px`,
                height: "10px",
                width: "10px",
                backgroundColor: indicator.color,
                borderRadius: "50%",
                opacity: 0.7,
              }}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

export default TaskScreen;
