import {Relation} from "./Relation";

export class HasOne extends Relation {
  related = null
  attribute = null

  constructor(related, attribute) {
    super()
    this.related = related
    this.attribute = attribute
  }
}