import { Types, Document } from 'mongoose';
import Group, { IGroup } from '../models/Group';
import Record from '../models/Record';
import MusicGenre from '../models/MusicGenre';

interface IGroupWithRecords extends IGroup {
  Records?: any[];
  nameMusicGenre?: string;
}

export interface IGroupWithRecordsCount {
  _id: Types.ObjectId;
  nameGroup: string;
  imageGroup?: string;
  musicGenre: {
    _id: Types.ObjectId;
    NameMusicGenre: string;
  } | null;
  totalRecords: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAll(): Promise<IGroupWithRecordsCount[]> {
  // Get all groups with populated music genre
  const groups = await Group.find()
    .populate('musicGenre', 'NameMusicGenre')
    .lean();
    
  // Get record counts for all groups in a single query
  const groupIds = groups.map(group => group._id);
  const recordCounts = await Record.aggregate([
    { $match: { Group: { $in: groupIds } } },
    { $group: { _id: '$Group', count: { $sum: 1 } } }
  ]);
  
  // Convert to a map for easy lookup
  const recordCountMap = new Map(
    recordCounts.map(rc => [rc._id.toString(), rc.count])
  );
    
  // Map groups and add record counts
  return groups.map((group: any) => ({
    _id: group._id,
    nameGroup: group.nameGroup,
    imageGroup: group.imageGroup,
    musicGenre: group.musicGenre ? {
      _id: group.musicGenre._id,
      NameMusicGenre: group.musicGenre.NameMusicGenre
    } : null,
    totalRecords: recordCountMap.get(group._id.toString()) || 0,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  }));
}

export async function getById(id: string): Promise<IGroup | null> {
  return await Group.findById(id).populate('musicGenre', 'NameMusicGenre');
}

export async function getRecordsByGroupId(id: string): Promise<IGroupWithRecords | null> {
  const group = await Group.findById(id);
  if (!group) return null;

  const records = await Record.find({ Group: id });
  const groupWithRecords: IGroupWithRecords = group.toObject();
  groupWithRecords.Records = records;

  return groupWithRecords;
}

export async function create(groupData: Omit<IGroup, '_id'>): Promise<IGroup> {
  return await Group.create(groupData);
}

export async function update(id: string, groupData: Partial<Omit<IGroup, '_id'>>): Promise<IGroup | null> {
  return await Group.findByIdAndUpdate(id, groupData, { new: true });
}

export async function remove(id: string): Promise<boolean> {
  const result = await Group.findByIdAndDelete(id);
  return result !== null;
}

export async function hasRecords(id: string): Promise<boolean> {
  const count = await Record.countDocuments({ Group: id }); // Adjust field name
  return count > 0;
}

export async function musicGenreExists(id: string): Promise<boolean> {
  const count = await MusicGenre.countDocuments({ _id: id });
  return count > 0;
}

export default {
  getAll,
  getById,
  getRecordsByGroupId,
  create,
  update,
  remove,
  hasRecords,
  musicGenreExists,
};