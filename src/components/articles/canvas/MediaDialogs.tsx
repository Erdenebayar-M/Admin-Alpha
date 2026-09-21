"use client";

import { useSyncExternalStore } from "react";
import { ImageBlockDialog } from "./ImageBlockDialog";
import { LinkCardBlockDialog } from "./LinkCardBlockDialog";
import type { MediaDialogStore } from "./media-dialog-store";
import { VideoBlockDialog } from "./VideoBlockDialog";

const noRequest = () => null;

/** Renders whichever media dialog `store` has open — image, video or link card — insert and edit both flow through it. */
export function MediaDialogs({ store }: { store: MediaDialogStore }) {
  const request = useSyncExternalStore(store.subscribe, store.getSnapshot, noRequest);

  function close() {
    store.close();
  }

  return (
    <>
      <ImageBlockDialog
        open={request?.kind === "image"}
        initial={request?.kind === "image" ? request.initial : null}
        onOpenChange={(open) => !open && close()}
        onSubmit={(block) => {
          if (request?.kind === "image") request.onSubmit(block);
          close();
        }}
      />
      <VideoBlockDialog
        open={request?.kind === "video"}
        initial={request?.kind === "video" ? request.initial : null}
        onOpenChange={(open) => !open && close()}
        onSubmit={(block) => {
          if (request?.kind === "video") request.onSubmit(block);
          close();
        }}
      />
      <LinkCardBlockDialog
        open={request?.kind === "link_card"}
        initial={request?.kind === "link_card" ? request.initial : null}
        onOpenChange={(open) => !open && close()}
        onSubmit={(block) => {
          if (request?.kind === "link_card") request.onSubmit(block);
          close();
        }}
      />
    </>
  );
}
