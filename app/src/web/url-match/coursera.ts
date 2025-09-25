import { parseTempFrag } from "@/lib/hash/temporal-frag";
import { noHashUrl } from "@/lib/url";
import { MediaHost } from "../../info/supported";
import {
  removeHashTempFragment,
  type URLDetecter,
  type URLResolver,
} from "./base";

export const courseraDetecter: URLDetecter = (url) => {
  return url.hostname === "www.coursera.org" ? MediaHost.Coursera : null;
};

export const courseraResolver: URLResolver = (url) => {
  const cleaned = noHashUrl(url);
  cleaned.search = "";

  const source = new URL(url);

  return {
    cleaned,
    source: removeHashTempFragment(source),
    tempFrag: parseTempFrag(url.hash),
  };
};
