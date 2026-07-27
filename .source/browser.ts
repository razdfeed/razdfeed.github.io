// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"connect.mdx": () => import("../content/docs/connect.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "rules.mdx": () => import("../content/docs/rules.mdx?collection=docs"), }),
};
export default browserCollections;