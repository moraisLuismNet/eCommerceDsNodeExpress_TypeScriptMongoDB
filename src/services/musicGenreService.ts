import mongoose from 'mongoose';
import MusicGenre, { IMusicGenre } from '../models/MusicGenre';
import Group from '../models/Group';

export interface MusicGenreWithCount {
  _id: any;
  nameMusicGenre: string;
  totalGroups: number;
}

export async function getAll(): Promise<MusicGenreWithCount[]> {
  
  // First, get all music genres to see what fields are available
  const allGenres = await MusicGenre.find({});
  
  const genres = await MusicGenre.aggregate([
    {
      $lookup: {
        from: 'groups',
        localField: '_id',
        foreignField: 'musicGenre',
        as: 'groups',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,  // Try different possible field names
        nameMusicGenre: 1,
        NameMusicGenre: 1,
        Name: 1,
        genre: 1,
        totalGroups: { $size: '$groups' },
      },
    }
  ]);
  
  // Map the response to use nameMusicGenre
  return genres.map(genre => {
    // Try to find the name field in the genre document
    const nameField = genre.nameMusicGenre || genre.NameMusicGenre || genre.name || genre.Name || genre.genre || 'Unknown';
    
    return {
      _id: genre._id,
      nameMusicGenre: nameField,
      totalGroups: genre.totalGroups || 0
    };
  });
}

export async function getById(id: string): Promise<IMusicGenre & { totalGroups: number } | null> {
  const result = await MusicGenre.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'groups',
        localField: '_id',
        foreignField: 'musicGenre',
        as: 'groups'
      }
    },
    {
      $project: {
        _id: 1,
        nameMusicGenre: 1,
        NameMusicGenre: 1,
        name: 1,
        Name: 1,
        genre: 1,
        totalGroups: { $size: '$groups' }
      }
    }
  ]);

  if (!result || result.length === 0) return null;
  
  const genre = result[0];
  // Use the first available name field
  const nameField = genre.nameMusicGenre || genre.NameMusicGenre || genre.name || genre.Name || genre.genre || 'Unknown';
  
  return {
    ...genre,
    nameMusicGenre: nameField,
    totalGroups: genre.totalGroups
  };
}

export async function searchByName(text: string): Promise<IMusicGenre[]> {
  // Perform a case-insensitive partial match
  const searchRegex = new RegExp(text, 'i');
  return await MusicGenre.find({
    $or: [
      { NameMusicGenre: searchRegex },
      { nameMusicGenre: searchRegex }
    ]
  });
}

export async function getSortedByName(ascending = true): Promise<IMusicGenre[]> {
  return await MusicGenre.find().sort({ NameMusicGenre: ascending ? 1 : -1 });
}

export async function create(name: string): Promise<IMusicGenre> {
  try {
    const genre = await MusicGenre.create({ NameMusicGenre: name });
    return genre;
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new Error('A music genre with this name already exists');
    }
    throw error;
  }
}

export async function update(id: string, name: string): Promise<IMusicGenre | null> {
  return await MusicGenre.findByIdAndUpdate(id, { NameMusicGenre: name }, { new: true });
}

export async function remove(id: string): Promise<IMusicGenre | null> {
  const genre = await MusicGenre.findById(id);
  if (!genre) {
    return null;
  }
  // You might want to check if there are any groups associated with this genre before deleting
  await MusicGenre.findByIdAndDelete(id);
  return genre;
}

export async function hasGroups(id: string): Promise<boolean> {
  const count = await Group.countDocuments({ MusicGenreId: id });
  return count > 0;
}

export default {
  getAll,
  getById,
  searchByName,
  getSortedByName,
  create,
  update,
  remove,
  hasGroups,
};