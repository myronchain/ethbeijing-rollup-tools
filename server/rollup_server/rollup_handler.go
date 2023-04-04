package rollup_server

import (
	"net/http"

	"github.com/g1g2-lab/automation/l2"

	"github.com/g1g2-lab/automation/pkg/db"
	"github.com/g1g2-lab/automation/types"
	"github.com/inconshreveable/log15"
	"github.com/labstack/echo/v4"
)

const (
	RollupResponseCodeSucceed = "succeed"
	RollupResponseCodeFailed  = "failed"
)

type RollupHandler struct {
	mgr *Manager
}

type RollupResponse struct {
	Message string      `json:"msg" validate:"required"`
	Code    string      `json:"code" validate:"required"`
	Data    interface{} `json:"data" validate:"required"`
}

func NewRollupHandler(
	db *db.LocalFileDatabase,
	cfg *l2.L2Config,
) *RollupHandler {
	return &RollupHandler{
		mgr: NewRollupManager(db, cfg),
	}
}

func (h *RollupHandler) SetupRollupRouter(e *echo.Echo, db *db.LocalFileDatabase) {
	api := e.Group("/api/v1")
	api.GET("/rollup/:id", h.getRollup)
	api.POST("/rollup/:id", h.createRollup)
	api.DELETE("/rollup/:id", h.deleteRollup)
	api.GET("/rollups", h.getRollups)
}

func (h *RollupHandler) getRollup(c echo.Context) error {
	chainName := c.Param("id")
	rollup, err := h.mgr.db.GetRollupByName(chainName)
	if err != nil {
		return c.JSON(http.StatusBadRequest, types.ResponseWithError(err.Error()))
	}
	return c.JSON(http.StatusOK, types.ResponseWithData(rollup))
}

func (h *RollupHandler) getRollups(c echo.Context) error {
	rollups, err := h.mgr.db.GetRollups()
	if err != nil {
		log15.Error(err.Error())
		return c.JSON(http.StatusBadRequest, types.ResponseWithError(err.Error()))
	}
	return c.JSON(http.StatusOK, types.ResponseWithData(rollups))
}

func (h *RollupHandler) createRollup(c echo.Context) error {
	var objRequest types.CreateRollupRequest
	// if err := c.Bind(&objRequest); err != nil {
	// 	log15.Error(err.Error())
	// 	return c.JSON(http.StatusBadRequest, types.ResponseWithError(err.Error()))
	// }
	// if err := c.Validate(&objRequest); err != nil {
	// 	return c.JSON(http.StatusBadRequest, types.ResponseWithError(err.Error()))
	// }
	objRequest.Name = "ethbeijing"
	objRequest.ChainId = 10405
	err := h.mgr.CreateRollup(&objRequest)
	if err != nil {
		return c.JSON(http.StatusNotAcceptable, types.ResponseWithError(err.Error()))
	}
	return c.JSON(http.StatusCreated, types.ResponseWithData("Rollup is created"))
}

func (h *RollupHandler) deleteRollup(c echo.Context) error {
	name := c.Param("id")
	err := h.mgr.DeleteRollup(name)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, types.ResponseWithMsg("Rollup deleted"))
}
