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
    app.use(
      express.static(
        path.join(
          __dirname,
          '../../../node_modules/arduino-serial-plotter-webapp/build'
        )
      )
    );
    app.get('/plotter', (req, res) =>
      res.sendFile(
        path.join(
          __dirname,
          '../../../node_modules/arduino-serial-plotter-webapp/build/index.html'
        )
      )
    );
  }
}
