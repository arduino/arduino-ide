import * as express from 'express';
import { injectable } from 'inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import path = require('path');

@injectable()
export class PlotterBackendContribution
  implements BackendApplicationContribution
{
  async initialize(): Promise<void> {}

  configure(app: express.Application): void {
    const relativePath = [
      '..',
      '..',
      '..',
      'build',
      'arduino-serial-plotter-webapp',
      'build',
    ];
    app.use(express.static(path.join(__dirname, ...relativePath)));
    app.get('/plotter', (req, res) => {
      console.log(
        `Serving serial plotter on http://${req.headers.host}${req.url}`
      );
      res.sendFile(path.join(__dirname, ...relativePath, 'index.html'));
    });
  }
}
