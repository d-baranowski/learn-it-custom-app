package base

import (
	"fmt"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"os"
)

func ConfigReader[T any](c T) *T {
	envFile, ok := os.LookupEnv("ENV_FILE")

	if ok {
		// dev only
		// make path absolute
		envFile = fmt.Sprintf("%s/%s", os.Getenv("PWD"), envFile)
		err := godotenv.Load(envFile)
		if err != nil {
			fmt.Printf("error loading .env file: %s\n", err)
		}
	}

	err := envconfig.Process("", &c)
	if err != nil {
		fmt.Printf("error processing env variables %s\n", err)
	}

	//v := validator.New()
	//
	//if err := v.Struct(&c); err != nil {
	//	var validationErrors validator.ValidationErrors
	//	errors.As(err, &validationErrors)
	//	for _, validationError := range validationErrors {
	//		fmt.Println(validationError.Error())
	//	}
	//	os.Exit(1)
	//}

	return &c
}
