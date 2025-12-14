import React from '@theia/core/shared/react';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { ReactDialog } from '../theia/dialogs/dialogs';
import { nls } from '@theia/core';
import { DialogProps } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { AppService } from '../app-service';
import { sanitize } from 'dompurify';

@injectable()
export class VersionWelcomeDialogProps extends DialogProps {}

@injectable()
export class VersionWelcomeDialog extends ReactDialog<void> {
  @inject(AppService)
  private readonly appService: AppService;

  @inject(WindowService)
  private readonly windowService: WindowService;

  constructor(
    @inject(VersionWelcomeDialogProps)
    protected override readonly props: VersionWelcomeDialogProps
  ) {
    super({
      title: nls.localize(
        'arduino/versionWelcome/title',
        'Welcome to a new version of Cognify IDE!'
      ),
    });
    this.node.id = 'version-welcome-dialog-container';
    this.contentNode.classList.add('version-welcome-dialog');
  }

  protected render(): React.ReactNode {
    return (
      <div>
        <p>
          {nls.localize(
            'arduino/versionWelcome/donateMessage',
            'Arduino is committed to keeping software free and open-source for everyone. Your donation helps us develop new features, improve libraries, and support millions of users worldwide.'
          )}
        </p>
        <p className="bold">
          {nls.localize(
            'arduino/versionWelcome/donateMessage2',
            'Please consider supporting our work on the free open source Arduino IDE.'
          )}
        </p>
      </div>
    );
  }

  override get value(): void {
    return;
  }

  private appendButtons(): void {
    const cancelButton = this.createButton(
      nls.localize('arduino/versionWelcome/cancelButton', 'Maybe later')
    );
    cancelButton.classList.add('secondary');
    cancelButton.classList.add('cancel-button');
    this.addAction(cancelButton, this.close.bind(this), 'click');
    this.controlPanel.appendChild(cancelButton);

    const donateButton = this.createButton(
      nls.localize('arduino/versionWelcome/donateButton', 'Donate now')
    );
    this.addAction(donateButton, this.onDonateButtonClick.bind(this), 'click');
    this.controlPanel.appendChild(donateButton);
    donateButton.focus();
  }

  private onDonateButtonClick(): void {
    this.openDonationPage();
    this.close();
  }

  private readonly openDonationPage = () => {
    const url = 'https://www.arduino.cc/en/donate';
    this.windowService.openNewWindow(url, { external: true });
  };

  private async updateTitleVersion(): Promise<void> {
    const appInfo = await this.appService.info();
    const { appVersion } = appInfo;

    if (appVersion) {
      this.titleNode.innerText = sanitize(
        nls.localize(
          'arduino/versionWelcome/titleWithVersion',
          'Welcome to the new Cognify IDE {0}!',
          appVersion
        )
      );
    }
  }

  protected override onAfterAttach(msg: Message): void {
    this.update();
    this.appendButtons();
    this.updateTitleVersion();
    super.onAfterAttach(msg);
  }
}
