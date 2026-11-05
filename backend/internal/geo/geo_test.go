package geo

import (
	"math"
	"testing"
)

func TestCellsReturnsParentAtRefreshResolution(t *testing.T) {
	r8, r5, err := Cells(1.3521, 103.8198)
	if err != nil {
		t.Fatal(err)
	}
	if r8 == 0 || r5 == 0 || r8 == r5 {
		t.Fatalf("unexpected cells: r8=%d r5=%d", r8, r5)
	}
}

func TestCellsRejectsInvalidCoordinates(t *testing.T) {
	if _, _, err := Cells(math.NaN(), 0); err == nil {
		t.Fatal("expected an error for NaN latitude")
	}
}
