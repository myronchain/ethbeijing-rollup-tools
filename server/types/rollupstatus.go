package types

// deploy step
const (
	// deploy step
	RollupInit          = 0
	RollupDeployOnL1    = 1
	BuildExecutionImage = 2
	BuildSequencerImage = 3
	WaitItOnline        = 4
	Online              = 5
)

// for status code
const (
	RUNNING = 1
	STOPPED = 2
	FAILED  = 3
)

// RollupStatus stored in firestore rollup_status collection, anyone can read it
type RollupStatus struct {
	ChainId int `json:"chain_id"`
	Step    int `json:"deploy_step"`
	//RunStep    int `json:"run_step"`
	// user facing status message
	Status     string `json:"status"`
	StatusCode int    `json:"status_code"`
	// internal error message for debugging
	ErrorMsg          string `json:"error"`
	LatestBlockNumber uint64 `json:"latest_block_number"`
	Name              string `json:"name"`
}
