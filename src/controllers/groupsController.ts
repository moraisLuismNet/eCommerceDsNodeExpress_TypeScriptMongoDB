import { Request, Response } from "express";
import groupService from "../services/groupService";
import mongoose from "mongoose";

// The GroupRequest interface might need further adjustments based on other controllers.
interface GroupRequest extends Request {
  params: {
    id?: string;
  };
  body: {
    nameGroup?: string;
    musicGenre?: string; // ObjectId
    imageUrl?: string; 
  };
}

async function getGroups(_req: Request, res: Response): Promise<Response> {
  try {
    const groups = await groupService.getAll();
    return res.json({ success: true, data: groups });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch groups";
    console.error("Error in getGroups:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function getGroupWithRecords(
  req: GroupRequest,
  res: Response
): Promise<Response> {
  const groupId = req.params.id;

  if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({
      success: false,
      message: "A valid Group ID is required",
    });
  }

  try {
    const group = await groupService.getRecordsByGroupId(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: `Group with ID ${groupId} not found`,
      });
    }
    return res.json({ success: true, data: group });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch group";
    console.error(`Error in getGroupWithRecords for ID ${groupId}:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function createGroup(
  req: GroupRequest,
  res: Response
): Promise<Response> {
  const { nameGroup, musicGenre, imageUrl } = req.body; 

  if (!nameGroup || !musicGenre) {
    return res.status(400).json({
      success: false,
      message: "nameGroup and musicGenre are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(musicGenre)) {
    return res.status(400).json({
      success: false,
      message: "musicGenre must be a valid ID",
    });
  }

  try {
    const genreExists = await groupService.musicGenreExists(musicGenre);
    if (!genreExists) {
      return res.status(400).json({
        success: false,
        message: `The musicGenre with ID ${musicGenre} does not exist`,
      });
    }

    const newGroup = {
      nameGroup,
      musicGenre,
      imageGroup: imageUrl || null, 
    };

    // The service now expects a proper Mongoose object
    const createdGroup = await groupService.create(newGroup as any);
    return res
      .status(201)
      .location(`/api/groups/${createdGroup._id}`)
      .json({ success: true, data: createdGroup });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create group";
    console.error("Error in createGroup:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function updateGroup(
  req: GroupRequest,
  res: Response
): Promise<Response> {
  const id = req.params.id;
  const { nameGroup, musicGenre, imageUrl } = req.body; 

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid Group ID is required",
    });
  }

  if (!nameGroup || musicGenre === undefined) {
    return res.status(400).json({
      success: false,
      message: "nameGroup and musicGenre are required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(musicGenre)) {
    return res.status(400).json({
      success: false,
      message: "musicGenre must be a valid ID",
    });
  }

  try {
    const group = await groupService.getById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: `Group with ID ${id} not found`,
      });
    }

    const genreExists = await groupService.musicGenreExists(musicGenre);
    if (!genreExists) {
      return res.status(400).json({
        success: false,
        message: `The musicGenre with ID ${musicGenre} does not exist`,
      });
    }

    const updatedGroupData = {
      nameGroup,
      musicGenre,
      imageGroup: imageUrl !== undefined ? imageUrl : group.imageGroup, 
    };

    const updatedGroup = await groupService.update(id, updatedGroupData as any);
    return res.json({
      success: true,
      data: updatedGroup,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update group";
    console.error(`Error in updateGroup for ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function deleteGroup(
  req: GroupRequest,
  res: Response
): Promise<Response> {
  const id = req.params.id;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid Group ID is required",
    });
  }

  try {
    const groupExists = await groupService.getById(id);
    if (!groupExists) {
      return res.status(404).json({
        success: false,
        message: `Group with ID ${id} not found`,
      });
    }

    const hasRecords = await groupService.hasRecords(id);
    if (hasRecords) {
      return res.status(400).json({
        success: false,
        message: `The Group with ID ${id} cannot be deleted because it has associated Records`,
      });
    }

    await groupService.remove(id);
    return res.status(204).send();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete group";
    console.error(`Error in deleteGroup for ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

export default {
  getGroups,
  getGroupWithRecords,
  createGroup,
  updateGroup,
  deleteGroup,
};
