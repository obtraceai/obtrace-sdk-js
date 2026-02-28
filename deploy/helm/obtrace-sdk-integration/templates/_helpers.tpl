{{- define "obtrace-sdk-integration.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "obtrace-sdk-integration.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "obtrace-sdk-integration.name" . -}}
{{- end -}}
{{- end -}}

{{- define "obtrace-sdk-integration.labels" -}}
app.kubernetes.io/name: {{ include "obtrace-sdk-integration.name" . }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
