import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGroup extends Document {
  nameGroup: string;
  imageGroup?: string;
  musicGenre: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const GroupSchema: Schema = new Schema(
  {
    nameGroup: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      minlength: [2, "Group name must be at least 2 characters long"],
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    imageGroup: {
      type: String,
      default: null, // Change default to null
    },
    musicGenre: {
      type: Schema.Types.ObjectId,
      ref: "MusicGenre",
      required: [true, "Music genre is required"],
    },
  },
  {
    timestamps: false,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create a case-insensitive index for nameGroup
GroupSchema.index(
  { nameGroup: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

// Clean up any old indexes with different field names
GroupSchema.post("init", async function () {
  try {
    const collection = this.collection;
    const indexes = await collection.indexes();

    for (const index of indexes) {
      // Drop any index that uses the old field names
      const indexKeys = Object.keys(index.key);
      const hasOldField = indexKeys.some((key) =>
        ["NameGroup", "MusicGenreId", "ImageGroup"].includes(key)
      );

      if (hasOldField && index.name) {
        try {
          await collection.dropIndex(index.name);
          console.log(`Dropped index: ${index.name}`);
        } catch (err) {
          console.warn(`Failed to drop index ${index.name}:`, err);
        }
      }
    }
  } catch (error) {
    console.warn("Error cleaning up group indexes:", error);
  }
});

const Group = mongoose.model<IGroup>("Group", GroupSchema);

export default Group;
