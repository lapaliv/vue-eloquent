import {Relation} from "./Relation";

export class HasOne extends Relation {
  constructor(related, attribute) {
    super()
    this.related = related
    this.attribute = attribute
  }
}