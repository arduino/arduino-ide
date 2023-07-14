import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { TreeNode } from '@theia/core/lib/browser/tree/tree';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { nls } from '@theia/core/lib/common/nls';
import { MaybePromise } from '@theia/core/lib/common/types';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import React from '@theia/core/shared/react';
import { CreateApi } from '../create/create-api';
import { AbstractDialog } from '../theia/dialogs/dialogs';

const RadioButton = (props: {
  id: string;
  changed: (evt: React.BaseSyntheticEvent) => void;
  value: string;
  isSelected: boolean;
  isDisabled: boolean;
  label: string;
}) => {
  return (
    <p className="RadioButton">
      <input
        id={props.id}
        onChange={props.changed}
        value={props.value}
        type="radio"
        checked={props.isSelected}
        disabled={props.isDisabled}
      />
      <label htmlFor={props.id}>{props.label}</label>
    </p>
  );
};

export const ShareSketchComponent = ({
  treeNode,
  createApi,
  domain = 'https://create.arduino.cc',
  writeClipboard,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  treeNode: any;
  createApi: CreateApi;
  domain?: string;
  writeClipboard: (text: string) => MaybePromise<void>;
}): React.ReactElement => {
  const [loading, setLoading] = React.useState<boolean>(false);

  const radioChangeHandler = async (event: React.BaseSyntheticEvent) => {
    setLoading(true);
    const sketch = await createApi.editSketch({
      id: treeNode.sketchId,
      params: {
        is_public: event.target.value === 'private' ? false : true,
      },
    });
    // setPublicVisibility(sketch.is_public);
    treeNode.isPublic = sketch.is_public;
    setLoading(false);
  };

  const sketchLink = `${domain}/editor/_/${treeNode.sketchId}/preview`;
  const embedLink = `<iframe src="${sketchLink}?embed" style="height:510px;width:100%;margin:10px 0" frameborder=0></iframe>`;

  return (
    <div id="widget-container arduino-sharesketch-dialog">
      <p>
        {nls.localize(
          'arduino/cloud/chooseSketchVisibility',
          'Choose visibility of your Sketch:'
        )}
      </p>
      <RadioButton
        changed={radioChangeHandler}
        id="1"
        isSelected={treeNode.isPublic === false}
        label={nls.localize(
          'arduino/cloud/privateVisibility',
          'Private. Only you can view the Sketch.'
        )}
        value="private"
        isDisabled={loading}
      />
      <RadioButton
        changed={radioChangeHandler}
        id="2"
        isSelected={treeNode.isPublic === true}
        label={nls.localize(
          'arduino/cloud/publicVisibility',
          'Public. Anyone with the link can view the Sketch.'
        )}
        value="public"
        isDisabled={loading}
      />

      {treeNode.isPublic && (
        <div>
          <p>{nls.localize('arduino/cloud/link', 'Link:')}</p>
          <div className="sketch-link">
            <input
              type="text"
              readOnly
              value={sketchLink}
              className="theia-input"
            />
            <button
              onClick={() => writeClipboard(sketchLink)}
              value="copy"
              className="theia-button secondary"
            >
              {nls.localize('vscode/textInputActions/copy', 'Copy')}
            </button>
          </div>
          <p>{nls.localize('arduino/cloud/embed', 'Embed:')}</p>
          <div className="sketch-link-embed">
            <textarea
              readOnly
              value={embedLink}
              className="theia-input stretch"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export class ShareSketchWidget extends ReactWidget {
  private readonly writeClipboard = (text: string) =>
    this.clipboardService.writeText(text);

  constructor(
    private treeNode: TreeNode,
    private createApi: CreateApi,
    private clipboardService: ClipboardService
  ) {
    super();
  }

  protected override render(): React.ReactNode {
    return (
      <ShareSketchComponent
        treeNode={this.treeNode}
        createApi={this.createApi}
        writeClipboard={this.writeClipboard}
      />
    );
  }
}

export class ShareSketchDialogProps extends DialogProps {
  readonly node: TreeNode;
  readonly createApi: CreateApi;
  readonly clipboardService: ClipboardService;
}

export class ShareSketchDialog extends AbstractDialog<void> {
  protected widget: ShareSketchWidget;

  constructor(protected override readonly props: ShareSketchDialogProps) {
    super({ title: props.title });
    this.contentNode.classList.add('arduino-share-sketch-dialog');
    this.widget = new ShareSketchWidget(
      props.node,
      props.createApi,
      props.clipboardService
    );
  }

  override get value(): void {
    return;
  }

  protected override onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    super.onAfterAttach(msg);
    this.update();
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
  }
}
