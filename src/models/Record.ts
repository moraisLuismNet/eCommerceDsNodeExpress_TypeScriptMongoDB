import mongoose, { Document, Schema } from "mongoose";

export interface IRecord extends Document {
  title: string;
  yearOfPublication: number;
  imageRecord?: string;
  price: number;
  stock: number;
  discontinued: boolean;
  nameGroup: string;
  Group: mongoose.Schema.Types.ObjectId;
  [key: string]: any; // To handle additional fields temporarily
}

const RecordSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  yearOfPublication: {
    type: Number,
    required: true,
  },
  imageRecord: {
    type: String,
    default: null, // Allow null and set as default
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  discontinued: {
    type: Boolean,
    required: true,
    default: false,
  },
  nameGroup: {
    type: String,
    required: true,
  },
  Group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  // To handle additional fields temporarily
  TitleRecord: { type: String, select: false },
  YearOfPublication: { type: Number, select: false },
  Price: { type: Number, select: false },
  Stock: { type: Number, select: false },
  Discontinued: { type: Boolean, select: false },
  GroupId: { type: mongoose.Schema.Types.ObjectId, select: false },
});

const Record = mongoose.model<IRecord>("Record", RecordSchema);

export default Record;
