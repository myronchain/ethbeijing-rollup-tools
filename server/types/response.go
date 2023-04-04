package types

const (
	ResponseCodeSucceed = "succeed"
	ResponseCodeFailed  = "failed"
)

type G1G2Response struct {
	Message string      `json:"msg" validate:"required"`
	Code    string      `json:"code" validate:"required"`
	Data    interface{} `json:"data" validate:"required"`
}

func ResponseWithData(data interface{}) G1G2Response {
	return G1G2Response{
		Message: "request succeed",
		Code:    ResponseCodeSucceed,
		Data:    data,
	}
}

func ResponseWithError(err string) G1G2Response {
	return G1G2Response{
		Message: err,
		Code:    ResponseCodeFailed,
	}
}

func ResponseWithMsg(msg string) G1G2Response {
	return G1G2Response{
		Message: msg,
		Code:    ResponseCodeSucceed,
	}
}
