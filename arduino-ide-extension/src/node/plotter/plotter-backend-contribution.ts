import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import express from '@theia/core/shared/express';
import { injectable } from '@theia/core/shared/inversify';
import path from 'node:path';
import { arduinoPlotterWebAppPath } from '../resources';

@injectable()
export class PlotterBackendContribution
  implements BackendApplicationContribution
{
  configure(app: express.Application): void {
    app.use(express.static(arduinoPlotterWebAppPath));
    app.get('/plotter', (req, res) => {
      console.log(
        `Serving serial plotter on http://${req.headers.host}${req.url}`
      );
      res.sendFile(path.join(arduinoPlotterWebAppPath, 'index.html'));
    });
  }
}
