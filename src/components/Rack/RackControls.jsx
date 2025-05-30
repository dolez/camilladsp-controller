import { Knob } from "./controls/Knob";
import { ConvolutionFileSelect } from "./controls/ConvolutionFileSelect";
import { VuMeter } from "./controls/VuMeter";

function ControlFieldset({ legend, children, className }) {
  return (
    <fieldset
      className={`border border-zinc-700 rounded px-3 py-2 flex-shrink-0 ${className}`}
    >
      <legend className="text-xs text-zinc-400 px-1">{legend}</legend>
      <div className="flex items-end gap-4">{children}</div>
    </fieldset>
  );
}

export function RackControls({
  config,
  metrics,
  onConfigChange,
  onLink,
  onUnlink,
  node,
  state,
  loadConvolutionFiles,
}) {
  if (!config?.filters) {
    console.warn("RackControls: config.filters is missing", config);
    return null;
  }

  const handleLimiterChange = (value) => {
    onConfigChange("limiter.clip_limit", value);
  };

  const handleDelayChange = (value) => {
    onConfigChange("delay.delay", value);
  };

  const handleConvFileChange = (value) => {
    onConfigChange("convolution.filename", value);
  };

  const handlePasseBasEntreeChange = (value) => {
    onConfigChange("input-lowpass.freq", value);
  };

  const handlePasseBasSortieChange = (value) => {
    onConfigChange("output-lowpass.freq", value);
  };

  const handleGainChange = (value) => {
    onConfigChange("gain", value);
  };

  const currentGain =
    config.mixers?.["Unnamed Mixer 1"]?.mapping?.[0]?.sources?.[0]?.gain ?? 0;

  return (
    <div className="flex flex-wrap gap-4 p-4">
      <ControlFieldset legend="Input">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-zinc-400 h-4 invisible">Level</div>
          <div className="flex items-end gap-1 pb-1">
            <VuMeter values={metrics?.captureRms ?? [-60, -60]} />
          </div>
        </div>
      </ControlFieldset>

      <ControlFieldset legend="Limiter">
        <Knob
          label="Threshold"
          value={config.filters.limiter.parameters.clip_limit}
          onChange={handleLimiterChange}
          min={-60}
          max={0}
          step={0.1}
          unit="dB"
          size="sm"
        />
      </ControlFieldset>

      <ControlFieldset legend="Input Lowpass">
        <Knob
          label="Freq"
          value={config.filters["input-lowpass"].parameters.freq}
          onChange={handlePasseBasEntreeChange}
          min={20}
          max={20000}
          step={1}
          unit="Hz"
          size="sm"
        />
      </ControlFieldset>

      <ControlFieldset legend="Delay">
        <Knob
          label="Time"
          value={config.filters.delay.parameters.delay}
          onChange={handleDelayChange}
          min={0}
          max={1000}
          step={1}
          unit="ms"
          size="sm"
        />
      </ControlFieldset>

      <ControlFieldset legend="Convolution">
        <ConvolutionFileSelect
          label="IR File"
          value={config.filters.convolution.parameters.filename}
          onChange={handleConvFileChange}
          node={node}
          files={state.convolutionFiles}
          onUploadSuccess={loadConvolutionFiles}
        />
      </ControlFieldset>

      <ControlFieldset legend="Output Lowpass">
        <Knob
          label="Freq"
          value={config.filters["output-lowpass"].parameters.freq}
          onChange={handlePasseBasSortieChange}
          min={20}
          max={20000}
          step={1}
          unit="Hz"
          size="sm"
        />
      </ControlFieldset>

      <ControlFieldset legend="Output" className="ml-auto">
        <div className="flex items-end gap-4">
          <Knob
            label="Gain"
            value={currentGain}
            onChange={handleGainChange}
            min={-60}
            max={20}
            step={0.1}
            unit="dB"
            size="sm"
          />
          <div className="flex gap-1 pb-1">
            <VuMeter values={metrics?.playbackRms ?? [-60, -60]} />
          </div>
        </div>
      </ControlFieldset>
    </div>
  );
}
