package openai

import (
	"context"
	"github.com/sashabaranov/go-openai"
	"go.uber.org/zap"
)

type ConversationMessage openai.ChatCompletionMessage

type Conversation struct {
	History []ConversationMessage
	Content string
}

func Chat(ctx context.Context, req Conversation) (*Conversation, error) {
	if Client == nil {
		return nil, ErrClientNotInitialised
	}

	// create array of messages to send
	msgs := make([]openai.ChatCompletionMessage, 0)

	// if we have a chat history, add it to the messages
	for _, m := range req.History {
		msgs = append(msgs, openai.ChatCompletionMessage(m))
	}

	// add the user's message to the messages
	msgs = append(msgs, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.Content,
	})

	zap.L().Info("Chat", zap.Any("msgs", msgs))

	// send the messages to the API
	completion, err := Client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:    openai.GPT4,
		Messages: msgs,
	})

	zap.L().Info("Chat", zap.Any("completion", completion))

	if err != nil {
		return nil, err
	}

	// create a response with the history and the response
	history := append(req.History, ConversationMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.Content,
	})

	history = append(history, ConversationMessage{
		Role:    openai.ChatMessageRoleAssistant,
		Content: completion.Choices[0].Message.Content,
	})

	c := &Conversation{
		History: history,
		Content: completion.Choices[0].Message.Content,
	}

	return c, nil

}
