import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Smile, Send } from "lucide-react";

type MessageInputProps = {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function MessageInput({ 
  onSendMessage, 
  placeholder = "Type your message...",
  disabled = false
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
      
      // Focus the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-3 pr-24 py-3 resize-none min-h-[60px] max-h-[180px]"
        disabled={disabled}
      />
      <div className="absolute right-3 bottom-3 flex items-center space-x-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:text-gray-500"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:text-gray-500"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
