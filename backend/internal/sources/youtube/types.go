package youtube

type searchResponse struct {
	NextPageToken string `json:"nextPageToken"`
	Items         []struct {
		ID struct {
			VideoID string `json:"videoId"`
		} `json:"id"`
	} `json:"items"`
}

type videosResponse struct {
	Items []Video `json:"items"`
}

// Video is the subset of the videos resource the adapter reads.
type Video struct {
	ID               string           `json:"id"`
	Snippet          Snippet          `json:"snippet"`
	Status           Status           `json:"status"`
	RecordingDetails RecordingDetails `json:"recordingDetails"`
}

// Snippet holds a video's descriptive metadata.
type Snippet struct {
	PublishedAt          string     `json:"publishedAt"`
	ChannelID            string     `json:"channelId"`
	ChannelTitle         string     `json:"channelTitle"`
	Title                string     `json:"title"`
	Description          string     `json:"description"`
	LiveBroadcastContent string     `json:"liveBroadcastContent"`
	Thumbnails           Thumbnails `json:"thumbnails"`
}

// Thumbnails lists the available image sizes.
type Thumbnails struct {
	Default Thumbnail `json:"default"`
	Medium  Thumbnail `json:"medium"`
	High    Thumbnail `json:"high"`
}

// Thumbnail is one image rendition.
type Thumbnail struct {
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
}

func (t Thumbnails) best() Thumbnail {
	for _, candidate := range []Thumbnail{t.High, t.Medium, t.Default} {
		if candidate.URL != "" {
			return candidate
		}
	}
	return Thumbnail{}
}

// Status holds a video's visibility flags.
type Status struct {
	PrivacyStatus string `json:"privacyStatus"`
	Embeddable    bool   `json:"embeddable"`
	MadeForKids   bool   `json:"madeForKids"`
}

// RecordingDetails holds where a video was recorded, when the owner shared it.
type RecordingDetails struct {
	LocationDescription string    `json:"locationDescription"`
	Location            *Location `json:"location"`
}

// Location uses pointers because 0,0 is a valid coordinate, unlike a missing one.
type Location struct {
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
}

type errorResponse struct {
	Error struct {
		Errors []struct {
			Reason string `json:"reason"`
		} `json:"errors"`
	} `json:"error"`
}
