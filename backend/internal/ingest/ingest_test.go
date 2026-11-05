package ingest

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/mock"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/testsuite"

	"nearbyfeed/internal/sources"
)

func input() RefreshInput {
	return RefreshInput{Lat: 1.35, Lng: 103.82, RadiusM: 12000}
}

func newEnv(t *testing.T) *testsuite.TestWorkflowEnvironment {
	t.Helper()
	var suite testsuite.WorkflowTestSuite
	env := suite.NewTestWorkflowEnvironment()
	env.RegisterActivity(&Activities{})
	return env
}

func TestRefreshStoresDiscoveredItems(t *testing.T) {
	env := newEnv(t)
	var activities *Activities
	refs := []sources.Ref{{ExternalID: "a"}, {ExternalID: "b"}}
	env.OnActivity(activities.Discover, mock.Anything, input()).Return(refs, nil)
	env.OnActivity(activities.HydrateAndStore, mock.Anything, input(), refs).
		Return(RefreshResult{New: 1, Updated: 1}, nil)

	env.ExecuteWorkflow(RefreshWorkflow, input())

	if err := env.GetWorkflowError(); err != nil {
		t.Fatal(err)
	}
	var result RefreshResult
	if err := env.GetWorkflowResult(&result); err != nil {
		t.Fatal(err)
	}
	if result != (RefreshResult{Discovered: 2, New: 1, Updated: 1}) {
		t.Fatalf("unexpected result: %+v", result)
	}
}

func TestRefreshSkipsHydrationWhenNothingFound(t *testing.T) {
	env := newEnv(t)
	var activities *Activities
	env.OnActivity(activities.Discover, mock.Anything, input()).Return([]sources.Ref{}, nil)

	env.ExecuteWorkflow(RefreshWorkflow, input())

	if err := env.GetWorkflowError(); err != nil {
		t.Fatal(err)
	}
	env.AssertNotCalled(t, "HydrateAndStore", mock.Anything, mock.Anything, mock.Anything)
}

func TestRefreshRetriesTransientFailures(t *testing.T) {
	env := newEnv(t)
	var activities *Activities
	calls := 0
	env.OnActivity(activities.Discover, mock.Anything, input()).Return(
		func(context.Context, RefreshInput) ([]sources.Ref, error) {
			calls++
			if calls < 3 {
				return nil, errors.New("connection reset")
			}
			return []sources.Ref{}, nil
		})

	env.ExecuteWorkflow(RefreshWorkflow, input())

	if err := env.GetWorkflowError(); err != nil {
		t.Fatal(err)
	}
	if calls != 3 {
		t.Fatalf("got %d attempts, want 3", calls)
	}
}

func TestRefreshDoesNotRetryExhaustedQuota(t *testing.T) {
	env := newEnv(t)
	var activities *Activities
	calls := 0
	env.OnActivity(activities.Discover, mock.Anything, input()).Return(
		func(context.Context, RefreshInput) ([]sources.Ref, error) {
			calls++
			return nil, temporal.NewNonRetryableApplicationError("quota", errTypeQuota, nil)
		})

	env.ExecuteWorkflow(RefreshWorkflow, input())

	if env.GetWorkflowError() == nil {
		t.Fatal("expected the workflow to fail")
	}
	if calls != 1 {
		t.Fatalf("got %d attempts, want 1: every retry would spend quota", calls)
	}
}
