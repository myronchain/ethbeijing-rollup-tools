package types

type DeploymentList struct {
	APIVersion string       `json:"apiVersion"`
	Kind       string       `json:"kind"`
	Metadata   Metadata     `json:"metadata"`
	Items      []Deployment `json:"items"`
}

type Metadata struct {
	SelfLink        string `json:"selfLink"`
	ResourceVersion string `json:"resourceVersion"`
	Name            string `json:"name"`
}

type Deployment struct {
	Metadata Metadata       `json:"metadata"`
	Spec     DeploymentSpec `json:"spec"`
	Status   Status         `json:"status"`
}

type DeploymentSpec struct {
	Replicas int `json:"replicas"`
	//Selector map[string]string `json:"selector"`
	Selector DeploymentSelector `json:"selector"`

	Template Template `json:"template"`
}

type DeploymentSelector struct {
	MatchLabels map[string]string `json:"matchLabels"`
}

type Template struct {
	Metadata Metadata `json:"metadata"`
	Spec     PodSpec  `json:"spec"`
}

type PodSpec struct {
	Containers []Container `json:"containers"`
}

//type Container struct {
//	Name  string `json:"name"`
//	Image string `json:"image"`
//	Ports []Port `json:"ports"`
//}

type Port struct {
	Name          string `json:"name"`
	ContainerPort int    `json:"containerPort"`
	Protocol      string `json:"protocol"`
}

type Status struct {
	ObservedGeneration int `json:"observedGeneration"`
	Replicas           int `json:"replicas"`
	UpdatedReplicas    int `json:"updatedReplicas"`
	AvailableReplicas  int `json:"availableReplicas"`
}

type PodList struct {
	APIVersion string   `json:"apiVersion"`
	Kind       string   `json:"kind"`
	Metadata   Metadata `json:"metadata"`
	Items      []Pod    `json:"items"`
}

type Pod struct {
	APIVersion string    `json:"apiVersion"`
	Kind       string    `json:"kind"`
	Metadata   Metadata  `json:"metadata"`
	Spec       PodSpec   `json:"spec"`
	Status     PodStatus `json:"status"`
}

type Container struct {
	Name         string            `json:"name"`
	Image        string            `json:"image"`
	Env          []EnvVar          `json:"env,omitempty"`
	Ports        []ContainerPort   `json:"ports,omitempty"`
	VolumeMounts []VolumeMount     `json:"volumeMounts,omitempty"`
	Resources    ContainerResource `json:"resources,omitempty"`
}

type EnvVar struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type ContainerPort struct {
	Name          string `json:"name,omitempty"`
	ContainerPort int32  `json:"containerPort"`
	Protocol      string `json:"protocol,omitempty"`
}

type VolumeMount struct {
	Name      string `json:"name"`
	MountPath string `json:"mountPath"`
}

type ContainerResource struct {
	Requests ResourceQuantity `json:"requests,omitempty"`
	Limits   ResourceQuantity `json:"limits,omitempty"`
}

type ResourceQuantity struct {
	CPU    string `json:"cpu,omitempty"`
	Memory string `json:"memory,omitempty"`
}

type PodStatus struct {
	Phase             string            `json:"phase"`
	Conditions        []PodCondition    `json:"conditions"`
	ContainerStatuses []ContainerStatus `json:"containerStatuses"`
}

type PodCondition struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	LastProbeTime      string `json:"lastProbeTime,omitempty"`
	LastTransitionTime string `json:"lastTransitionTime,omitempty"`
	Reason             string `json:"reason,omitempty"`
	Message            string `json:"message,omitempty"`
}

type ContainerStatus struct {
	Name         string            `json:"name"`
	Image        string            `json:"image"`
	State        ContainerState    `json:"state"`
	Ready        bool              `json:"ready"`
	RestartCount int32             `json:"restartCount"`
	LastState    ContainerState    `json:"lastState"`
	ImageID      string            `json:"imageID"`
	ContainerID  string            `json:"containerID"`
	Started      *bool             `json:"started,omitempty"`
	VolumeMounts []VolumeMount     `json:"volumeMounts,omitempty"`
	Resources    ContainerResource `json:"resources,omitempty"`
}

type ContainerState struct {
	Waiting    *ContainerStateWaiting    `json:"waiting,omitempty"`
	Running    *ContainerStateRunning    `json:"running,omitempty"`
	Terminated *ContainerStateTerminated `json:"terminated,omitempty"`
}

type ContainerStateWaiting struct {
	Reason  string `json:"reason,omitempty"`
	Message string `json:"message,omitempty"`
}

type ContainerStateRunning struct {
	StartedAt string `json:"startedAt,omitempty"`
}

type ContainerStateTerminated struct {
	ExitCode    int32  `json:"exitCode,omitempty"`
	Reason      string `json:"reason,omitempty"`
	Message     string `json:"message,omitempty"`
	StartedAt   string `json:"startedAt,omitempty"`
	FinishedAt  string `json:"finishedAt,omitempty"`
	ContainerID string `json:"containerID,omitempty"`
}
