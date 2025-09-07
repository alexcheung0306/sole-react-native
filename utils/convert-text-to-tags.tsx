"use client"

import { useRouter } from "expo-router"

export function ConvertTextToTags({ text }: { text: string }) {
  const router = useRouter()

  if (!text || typeof text !== "string") {
    console.log("Invalid text prop:", text)
    return <div></div>
  }

  const lines = text.split("\n")
  const result = []
  // Use a more specific emoji regex to avoid matching numbers
  const emojiRegex =
    /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
  const validTagRegex = /^[a-zA-Z0-9_.]+$/

  for (const [lineIndex, line] of lines.entries()) {
    const words = line.split(" ")
    const allWords = []

    for (const [wordIndex, word] of words.entries()) {
      const nextWord = words[wordIndex + 1]
      const tagContent = word.slice(1)

      const isUserTag =
        word.startsWith("@") &&
        word.length > 1 &&
        !emojiRegex.test(tagContent) &&
        validTagRegex.test(tagContent)

      const isHashTag =
        word.startsWith("#") &&
        word.length > 1 &&
        !emojiRegex.test(tagContent) &&
        validTagRegex.test(tagContent)

      // Debug log for @123312
      if (word === "@123312") {
        console.log("Debug @123312:", {
          word,
          isUserTag,
          tagContent,
          startsWithAt: word.startsWith("@"),
          lengthValid: word.length > 1,
          noEmoji: !emojiRegex.test(tagContent),
          regexValid: validTagRegex.test(tagContent),
          nextWord,
          emojiMatch: emojiRegex.test(tagContent)
            ? tagContent.match(emojiRegex)
            : "No emoji match",
        })
      }

      if (isUserTag) {
        allWords.push(
          <div
            onClick={() => router.push(`/user/${tagContent}` as any)}
            className="cursor-pointer atTaghashTag"
            key={`bold-user-${lineIndex}-${wordIndex}`}
          >
            {word + " "}
          </div>
        )
      } else if (isHashTag) {
        allWords.push(
          <div
            onClick={() => router.push(`/explore/${tagContent}` as any)}
            className="text-tags cursor-pointer atTaghashTag"
            key={`tag-${lineIndex}-${wordIndex}`}
          >
            {word + " "}
          </div>
        )
      } else {
        allWords.push(
          <span key={`non-tag-${lineIndex}-${wordIndex}`}>{word} </span>
        )
      }
    }

    result.push(
      <div className="flex" key={`line-${lineIndex}`}>
        {allWords}
      </div>
    )
  }

  return <div>{result}</div>
}
