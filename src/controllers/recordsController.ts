import { Request, Response } from "express";
import recordService from "../services/recordService";
import groupService from "../services/groupService";
import mongoose from "mongoose";
import { IRecord } from "../models/Record";

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface RecordRequest extends Request {
  body: {
    title?: string | string[];
    yearOfPublication?: string | string[];
    price?: string | string[];
    stock?: string | string[];
    discontinued?: string | string[] | boolean;
    Group?: string | string[];
    GroupId?: string | string[];
    imageUrl?: string | string[]; 
    imageRecord?: string | string[]; 
  };
  params: {
    id?: string;
    amount?: string;
  };
  file?: Express.Multer.File;
}

async function getRecords(req: Request, res: Response<ApiResponse>) {
  try {
    const records = await recordService.getAll();
    res.json({
      success: true,
      message: "Records retrieved successfully",
      data: records,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function getRecordById(req: Request, res: Response<ApiResponse>) {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid ID is required" });
  }

  try {
    const record = await recordService.getById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
    res.json({
      success: true,
      message: "Record retrieved successfully",
      data: record,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function deleteRecord(req: Request, res: Response<ApiResponse>) {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid ID is required" });
  }

  try {
    const success = await recordService.remove(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function updateStock(
  req: Request,
  res: Response<ApiResponse<{ message: string; newStock: number }>>
) {
  const { id, amount } = req.params;

  // Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.error(`[updateStock] Invalid ID: ${id}`);
    return res.status(400).json({
      success: false,
      message: "A valid ID is required",
      error:
        process.env.NODE_ENV === "development"
          ? "Invalid ID format"
          : undefined,
    });
  }

  // Validate amount
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    console.error(`[updateStock] Invalid amount: ${amount}`);
    return res.status(400).json({
      success: false,
      message: "Invalid amount",
      error:
        process.env.NODE_ENV === "development"
          ? "Amount must be a valid number"
          : undefined,
    });
  }

  try {
    const result = await recordService.updateStock(id, numAmount);

    if (!result) {
      console.error(`[updateStock] Record not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Record not found",
        error:
          process.env.NODE_ENV === "development"
            ? `No record found with ID: ${id}`
            : undefined,
      });
    }

    res.json({
      success: true,
      message: `The stock of the record has been updated by ${
        numAmount > 0 ? "+" : ""
      }${numAmount} units`,
      data: {
        message: "Stock updated successfully",
        newStock: result.newStock,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(
      `[updateStock] Error updating stock for record ${id}:`,
      error
    );

    // More specific error handling based on error message
    let statusCode = 400;
    let errorResponse = "Bad request";

    if (errorMessage.includes("not found")) {
      statusCode = 404;
      errorResponse = "Record not found";
    } else if (
      errorMessage.includes("decrease") &&
      errorMessage.includes("greater than")
    ) {
      statusCode = 400;
      errorResponse = "Insufficient stock";
    }

    res.status(statusCode).json({
      success: false,
      message: errorResponse,
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function createRecord(req: RecordRequest, res: Response<ApiResponse>) {
  try {
    // Retrieve and clean the form values
    const getValue = (value: any): string | undefined => {
      if (Array.isArray(value)) return value[0]?.trim();
      if (typeof value === 'string') return value.trim();
      return value?.toString().trim();
    };

      // Extract values from request body, handling both cases
      const getValueFromAnyCase = (obj: any, keys: string[]): string | undefined => {
        for (const key of keys) {
          const value = getValue(obj[key]);
          if (value !== undefined) return value;
        }
        return undefined;
      };

      const title = getValueFromAnyCase(req.body, ['title', 'TitleRecord']);
      const yearOfPublication = getValueFromAnyCase(req.body, ['yearOfPublication', 'YearOfPublication']);
      const price = getValueFromAnyCase(req.body, ['price', 'Price']);
      const stock = getValueFromAnyCase(req.body, ['stock', 'Stock']);
      const discontinued = getValueFromAnyCase(req.body, ['discontinued', 'Discontinued']);
      const groupId = getValueFromAnyCase(req.body, ['Group', 'GroupId', 'group', 'groupId']);
      const imageRecord = getValueFromAnyCase(req.body, ['imageRecord', 'ImageRecord', 'imageUrl', 'imageurl']);
      
      // Convert values to the correct types
      const parsedStock = stock ? parseInt(stock, 10) : undefined;
      const parsedDiscontinued = discontinued === 'true' || discontinued === '1';
      const parsedPrice = price ? parseFloat(price) : undefined;
      const parsedYear = yearOfPublication ? parseInt(yearOfPublication, 10) : undefined;

      // Validate required fields
      const errors: string[] = [];
      if (!title) errors.push('The title is required');
      if (!parsedYear || isNaN(parsedYear)) errors.push('The year of publication must be a valid number');
      if (!parsedPrice || isNaN(parsedPrice)) errors.push('The price must be a valid number');
      if (parsedStock === undefined || isNaN(parsedStock)) errors.push('The stock must be a valid number');
      if (!groupId) errors.push('The group ID is required');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Error of validation: ' + errors.join(', ')
        });
      }

      if (!mongoose.Types.ObjectId.isValid(groupId as string)) {
        return res.status(400).json({ 
          success: false, 
          message: "The group ID is not valid" 
        });
      }

      const group = await groupService.getById(groupId as string);
      if (!group) {
        return res.status(400).json({
          success: false,
          message: `No exists a group with the ID ${groupId}`,
        });
      }

      const newRecord = {
        title: title as string,
        yearOfPublication: parsedYear as number,
        price: parsedPrice as number,
        stock: parsedStock as number,
        discontinued: parsedDiscontinued,
        Group: groupId,
        nameGroup: group.nameGroup,
        imageRecord: imageRecord || null,
      };

      try {
        const createdRecord = await recordService.create(newRecord as any);
        
        return res.status(201).json({
          success: true,
          message: "Record created successfully",
          data: createdRecord,
        });
      } catch (dbError) {
        console.error('Error in createRecord:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error al guardar el record in the database',
          error: process.env.NODE_ENV === 'development' ? (dbError as Error).message : undefined,
        });
      }
  } catch (error: unknown) {
    console.error('Error in createRecord:', error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function updateRecord(req: RecordRequest, res: Response<ApiResponse>) {
  
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid ID is required" });
  }

  try {
    const record = await recordService.getById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Record with ID ${id} not found`,
      });
    }

    const { Group, GroupId } = req.body;
    const groupIdToUpdate = Group || GroupId;
    let groupName: string | undefined;

    if (groupIdToUpdate) {
      // Handle case where groupIdToUpdate might be an array
      const groupId = Array.isArray(groupIdToUpdate) ? groupIdToUpdate[0] : groupIdToUpdate;
      
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res
          .status(400)
          .json({ success: false, message: "A valid GroupID is required" });
      }
      const group = await groupService.getById(groupId);
      if (!group) {
        return res.status(400).json({
          success: false,
          message: `The Group with ID ${groupIdToUpdate} does not exist`,
        });
      }
      groupName = group.nameGroup;
    }

    const updatedData: Partial<IRecord> & {
      Group?: mongoose.Types.ObjectId;
      nameGroup?: string;
      imageRecord?: string;
    } = {};
    if (req.body.title) updatedData.title = Array.isArray(req.body.title) ? req.body.title[0] : req.body.title;
    if (req.body.yearOfPublication) {
      const year = Array.isArray(req.body.yearOfPublication) ? req.body.yearOfPublication[0] : req.body.yearOfPublication;
      updatedData.yearOfPublication = Number(year);
    }
    if (req.body.price) {
      const price = Array.isArray(req.body.price) ? req.body.price[0] : req.body.price;
      updatedData.price = Number(price);
    }
    if (req.body.stock !== undefined) {
      const stock = Array.isArray(req.body.stock) ? req.body.stock[0] : req.body.stock;
      updatedData.stock = Number(stock);
    }
    if (req.body.discontinued !== undefined) {
      const discontinued = Array.isArray(req.body.discontinued) ? req.body.discontinued[0] : req.body.discontinued;
      updatedData.discontinued = String(discontinued).toLowerCase() === 'true';
    }
    if (groupIdToUpdate) {
      const groupId = Array.isArray(groupIdToUpdate) ? groupIdToUpdate[0] : groupIdToUpdate;
      updatedData.Group = new mongoose.Types.ObjectId(groupId) as any;
      if (groupName) {
        updatedData.nameGroup = groupName;
      }
    }

    // Handle image update - use imageUrl for consistency with groups
    if (req.body.imageUrl !== undefined) {
      updatedData.imageRecord = Array.isArray(req.body.imageUrl) ? req.body.imageUrl[0] : req.body.imageUrl;
    } else if (req.body.imageRecord !== undefined) {
      // For backward compatibility
      updatedData.imageRecord = Array.isArray(req.body.imageRecord) ? req.body.imageRecord[0] : req.body.imageRecord;
    }

    const updatedRecord = await recordService.update(id, updatedData);
    
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }
    
    return res.json({
      success: true,
      message: 'Record updated successfully',
      data: updatedRecord,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

export default {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  updateStock,
};
