import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMusicGenre extends Document {
  NameMusicGenre: string;
}

interface IMusicGenreModel extends Model<IMusicGenre> {
  cleanupIndexes?(): Promise<void>;
}

const MusicGenreSchema: Schema = new Schema({
  NameMusicGenre: {
    type: String,
    required: [true, 'NameMusicGenre is required'],
    trim: true,
    minlength: [2, 'NameMusicGenre must be at least 2 characters long'],
    maxlength: [50, 'NameMusicGenre cannot exceed 50 characters']
  }
}, {
  timestamps: false, // Disable automatic timestamps
  versionKey: false
});

// Create a case-insensitive index
MusicGenreSchema.index({ NameMusicGenre: 1 }, { 
  unique: true, 
  collation: { 
    locale: 'en', 
    strength: 2 
  } 
});

// Add static method to clean up old indexes
MusicGenreSchema.statics.cleanupIndexes = async function() {
  try {
    const collection = this.collection;
    const indexes = await collection.indexes();
    
    for (const index of indexes) {
      // Drop any index that includes nameMusicGenre (case insensitive check)
      const indexKeys = Object.keys(index.key);
      const hasInvalidKey = indexKeys.some(key => 
        key.toLowerCase() === 'namemusicgenre' && key !== 'NameMusicGenre'
      );
      
      if (hasInvalidKey && index.name) {
        try {
          await collection.dropIndex(index.name);
          console.log(`Dropped index: ${index.name}`);
        } catch (err) {
          console.warn(`Failed to drop index ${index.name}:`, err);
        }
      }
    }
  } catch (error) {
    console.warn('Error cleaning up indexes:', error);
  }
};

const MusicGenre = mongoose.model<IMusicGenre, IMusicGenreModel>('MusicGenre', MusicGenreSchema);

// Run cleanup when the model is first loaded
MusicGenre.cleanupIndexes?.().catch(console.error);

export default MusicGenre;