{{/*
Expand the name of the chart.
*/}}
{{- define "nodle.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "chart.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}


{{/*
Create a fully qualified indexer name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}

{{- define "nodle.indexer.fullname" -}}
{{- if .Values.indexer.fullnameOverride -}}
{{- .Values.indexer.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s-%s" .Release.Name .Values.indexer.name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s-%s" .Release.Name $name .Values.indexer.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create unified labels for nodle components
*/}}
{{- define "nodle.common.matchLabels" -}}
app: {{ template "nodle.name" . }}
release: {{ .Release.Name }}
{{- end -}}

{{- define "nodle.common.metaLabels" -}}
chart: {{ template "nodle.chart" . }}
heritage: {{ .Release.Service }}
{{- end -}}

{{- define "nodle.indexer.labels" -}}
{{ include "nodle.indexer.matchLabels" . }}
{{ include "nodle.common.metaLabels" . }}
{{- end -}}

{{- define "nodle.indexer.matchLabels" -}}
component: {{ .Values.indexer.name | quote }}
{{ include "nodle.common.matchLabels" . }}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "nodle.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "chart.labels" -}}
helm.sh/chart: {{ include "nodle.chart" . }}
{{ include "chart.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "chart.selectorLabels" -}}
app.kubernetes.io/app: {{ include "nodle.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Indexer selector labels
*/}}
{{- define "chart.indexerSelectorLabels" -}}
app.kubernetes.io/app: {{ include "nodle.name" . }}
app.kubernetes.io/name: indexer
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Define the nodle.namespace template if set with forceNamespace or .Release.Namespace is set
*/}}
{{- define "nodle.namespace" -}}
{{- if .Values.forceNamespace -}}
{{ printf "namespace: %s" .Values.forceNamespace }}
{{- else -}}
{{ printf "namespace: %s" .Release.Namespace }}
{{- end -}}
{{- end -}}


{{/*
Create a fully qualified graphql name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}

{{- define "nodle.graphql.fullname" -}}
{{- if .Values.graphql.fullnameOverride -}}
{{- .Values.graphql.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s-%s" .Release.Name .Values.graphql.name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s-%s" .Release.Name $name .Values.graphql.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Graphql selector labels
*/}}
{{- define "chart.graphqlSelectorLabels" -}}
app.kubernetes.io/app: {{ include "nodle.name" . }}
app.kubernetes.io/name: graphql
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "nodle.graphql.labels" -}}
{{ include "nodle.graphql.matchLabels" . }}
{{ include "nodle.common.metaLabels" . }}
{{- end -}}

{{- define "nodle.graphql.matchLabels" -}}
component: {{ .Values.graphql.name | quote }}
{{ include "nodle.common.matchLabels" . }}
{{- end -}}


{{/*
Create a fully qualified backfiller name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}

{{- define "nodle.backfiller.fullname" -}}
{{- if .Values.backfiller.fullnameOverride -}}
{{- .Values.backfiller.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "%s-%s" .Release.Name .Values.backfiller.name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s-%s" .Release.Name $name .Values.backfiller.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Backfiller selector labels
*/}}
{{- define "chart.backfillerSelectorLabels" -}}
app.kubernetes.io/app: {{ include "nodle.name" . }}
app.kubernetes.io/name: backfiller
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "nodle.backfiller.labels" -}}
{{ include "nodle.backfiller.matchLabels" . }}
{{ include "nodle.common.metaLabels" . }}
{{- end -}}

{{- define "nodle.backfiller.matchLabels" -}}
component: {{ .Values.backfiller.name | quote }}
{{ include "nodle.common.matchLabels" . }}
{{- end -}}

