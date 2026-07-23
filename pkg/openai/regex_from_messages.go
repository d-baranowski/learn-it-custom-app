package openai

import (
	"context"
	jsoniter "github.com/json-iterator/go"
	"github.com/sashabaranov/go-openai"
	"strings"
)

const RegexFromMessagesPrompt = `
	You are automated assistant that creates regular expressions from a series of similar messages.
	First, establish if the messages follow a logical pattern, if they do not, return an error message in the error field and success = false.  
	The error message should be conversational and explain why the messages do not follow a pattern.
	If the messages do follow a pattern, extract the pattern and create a regex that matches all messages.
	You MUST follow these rules when creating your regex:
		- You MUST NOT use unions of strings like (cat|bat|cow), instead use character, word or digit classes like w or d.
		- You must generate VALID regex
		- YOu MUST NOT use literal string from the original message in capturing groups
		- If the pattern is of a inconsistent length, use a quantifier to constrain them to a min and max length like d{n,m} 
		- You MUST use start and end anchors to ensure the regex matches the entire message
		- Each message must return true when tested with 'new Regex(regex).test(message)'

	Your response should be in JSON format and match this typescript interface.
	
	interface Response {
		success: boolean;
		regex: string;
		error?: string;
	}
`

type RegexFromMessagesResponse struct {
	Success bool   `json:"success"`
	Regex   string `json:"regex"`
	Error   string `json:"error"`
}

func RegexFromMessages(ctx context.Context, patterns []string) (*RegexFromMessagesResponse, error) {
	if Client == nil {
		return nil, ErrClientNotInitialised
	}

	msgs := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: RegexFromMessagesPrompt,
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: strings.Join(patterns, "\n"),
		},
	}

	completion, err := Client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:    openai.GPT4,
		Messages: msgs,
	})
	if err != nil {
		return nil, err
	}

	resp := &RegexFromMessagesResponse{}
	err = jsoniter.UnmarshalFromString(completion.Choices[0].Message.Content, resp)
	if err != nil {
		return nil, err
	}

	return resp, nil
}
