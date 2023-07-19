import * as path from 'node:path';
import * as express from '@theia/core/shared/express';
import { injectable } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';

@injectable()
export class PlotterBackendContribution
  implements BackendApplicationContribution
{
  configure(app: express.Application): void {
    const index = require.resolve(
      'arduino-serial-plotter-webapp/build/index.html'
    );
    app.use(express.static(path.join(index, '..')));
    app.get('/plotter', (req, res) => {
      console.log(
        `Serving serial plotter on http://${req.headers.host}${req.url}`
      );
      res.sendFile(index);
    });
  }
}
