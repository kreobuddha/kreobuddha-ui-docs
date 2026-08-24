import { useState } from 'react';

import { Badge, Button, Progress, Select, Switch, Tabs, TextField } from '@components/ui';
import { presets } from '@utils/theme';

interface HeroPanelLabels {
  panel: string;
  tabs: [string, string, string];
  presets: string;
  presetDefault: string;
}

const HeroPanel = ({ labels }: { labels: HeroPanelLabels }) => {
  const [preset, setPreset] = useState<string>('default');

  const values = presets.find((candidate) => candidate.id === preset)?.values ?? {};

  const deploy = (
    <div className="hero-panel__form">
      <TextField label="Service" defaultValue="atlas-gateway" fullWidth />
      <Select label="Environment" defaultValue="staging" fullWidth>
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
      </Select>
      <Switch label="Run migrations first" defaultChecked />
      <Progress label="Rolling out" value={62} />
      <div className="hero-panel__actions">
        <Button size="sm">Deploy</Button>
        <Button size="sm" variant="outlined">
          Dry run
        </Button>
      </div>
    </div>
  );

  return (
    <div className="hero-panel">
      <div className="hero-panel__frame preview-scope" style={values} aria-label={labels.panel}>
        <div className="hero-panel__bar">
          <span className="hero-panel__dots" aria-hidden="true" />
          <Badge tone="success" dot>
            live
          </Badge>
        </div>

        <Tabs
          items={[
            { id: 'deploy', label: labels.tabs[0], content: deploy },
            {
              id: 'logs',
              label: labels.tabs[1],
              content: (
                <pre className="hero-panel__logs">
                  <code>{'12:04:11  build   ok      2.4s\n12:04:13  upload  ok      0.8s\n12:04:14  health  ok      3/3'}</code>
                </pre>
              ),
            },
            {
              id: 'access',
              label: labels.tabs[2],
              content: (
                <div className="hero-panel__form">
                  <Switch label="Require review" defaultChecked />
                  <Switch label="Allow force push" />
                </div>
              ),
            },
          ]}
        />
      </div>

      <fieldset className="hero-panel__presets">
        <legend>{labels.presets}</legend>
        {[{ id: 'default', label: labels.presetDefault }, ...presets].map((candidate) => (
          <label key={candidate.id}>
            <input
              type="radio"
              name="hero-preset"
              value={candidate.id}
              checked={preset === candidate.id}
              onChange={() => setPreset(candidate.id)}
            />
            <span>{candidate.label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
};

export default HeroPanel;
