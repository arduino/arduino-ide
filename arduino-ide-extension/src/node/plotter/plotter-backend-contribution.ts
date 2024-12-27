import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import express from '@theia/core/shared/express';
import { injectable } from '@theia/core/shared/inversify';
import path from 'node:path';
import { arduinoPlotterWebAppPath } from '../resources';

@injectable()
export class PlotterBackendContribution
  implements BackendApplicationContribution {
  configure(app: express.Application): void {
    // 使用express.static()方法将arduinoPlotterWebAppPath路径下的静态文件作为静态资源
    app.use(express.static(arduinoPlotterWebAppPath));
    // 当访问/plotter路径时，返回index.html文件
    app.get('/plotter', (req, res) => {
      // 打印访问的url
      console.log(
        `Serving serial plotter on http://${req.headers.host}${req.url}`
      );
      // 返回index.html文件
      res.sendFile(path.join(arduinoPlotterWebAppPath, 'index.html'));
    });
  }
}
