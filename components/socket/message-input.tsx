import { Button, Textarea } from "@heroui/react"
import Picker, { Theme } from "emoji-picker-react"
import { Laugh } from "lucide-react"

export function MessageInput({
  showPicker,
  setShowPicker,
  handleSendMessage,
  messageToSend,
  setMessageToSend,
}) {
  const onEmojiClick = (emojiObject: { emoji: string }) => {
    if (emojiObject?.emoji) {
      setMessageToSend((prevInput) => prevInput + emojiObject.emoji)
    }
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  return (
    <div className=" bottom-0 w-full flex no-wrap gap-1 z-10 border-t bg-background/10 backdrop-blur-lg flex flex-col">
      {showPicker && (
        <Picker
          theme={Theme.DARK} // Assert the type
          width={"100%"}
          onEmojiClick={onEmojiClick}
        />
      )}

      <div className="flex w-auto  px-5 py-2 gap-2">
        <Textarea
          startContent={
            <Laugh
              className="cursor-pointer text-white h-6 w-6 hover:text-gray-300"
              aria-label="Open emoji picker"
              onClick={() => setShowPicker(!showPicker)}
            />
          }
          minRows={1}
          className="grow"
          placeholder="Send message"
          value={messageToSend}
          onChange={(e) => setMessageToSend(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          classNames={{
            inputWrapper: [
              "bg-default-200/50",
              "dark:bg-default/60",
              "backdrop-blur-xl",
              "backdrop-saturate-200",
              "hover:bg-default-200/70",
              "dark:hover:bg-default/70",
              "group-data-[focus=true]:bg-default-200/50",
              "dark:group-data-[focus=true]:bg-default/60",
            ],
            input: [
              "bg-transparent",
              "text-white",
              "placeholder:text-white/60",
            ],
          }}
        />
        <Button onPress={handleSendMessage}>Send</Button>
      </div>
    </div>
  )
}
