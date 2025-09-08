import { Request, Response } from 'express';
import musicGenreService from "../services/musicGenreService";
import mongoose from 'mongoose';

interface MusicGenreRequest extends Request {
    params: {
        id?: string;
        text?: string;
        ascen?: string;
    };
    body: {
        nameMusicGenre?: string; // This is the field name from the request
    };
}

async function getMusicGenres(_req: Request, res: Response): Promise<Response> {
    try {
        const genres = await musicGenreService.getAll();
        return res.status(200).json({
            success: true,
            data: genres
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch music genres';
        console.error('Error in getMusicGenres:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function getMusicGenreById(req: MusicGenreRequest, res: Response): Promise<Response> {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'A valid ID is required' });
    }

    try {
        const genre = await musicGenreService.getById(id);
        if (!genre) {
            return res.status(404).json({
                success: false,
                message: `MusicGenre with ID ${id} not found`
            });
        }
        return res.status(200).json({
            success: true,
            data: genre
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch music genre';
        console.error('Error in getMusicGenreById:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function searchByName(req: MusicGenreRequest, res: Response): Promise<Response> {
    try {
        const searchText = req.params.text || '';
        if (!searchText.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Search text is required'
            });
        }

        const genres = await musicGenreService.searchByName(searchText.trim());

        if (!genres || genres.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No musical genres found matching '${searchText}'`
            });
        }

        // Map the results to ensure consistent response format
        const formattedGenres = genres.map(genre => {
            // Handle both possible field names in the response
            const genreName = (genre as any).nameMusicGenre || genre.NameMusicGenre;
            return {
                _id: genre._id,
                nameMusicGenre: genreName,
                // Include any other fields you want to return
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedGenres
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search music genres';
        console.error('Error in searchByName:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function getSortedByName(req: MusicGenreRequest, res: Response): Promise<Response> {
    try {
        const ascen = req.params.ascen === 'true';
        const genres = await musicGenreService.getSortedByName(ascen);

        if (!genres || genres.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No musical genres found'
            });
        }

        return res.status(200).json({
            success: true,
            data: genres
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sorted music genres';
        console.error('Error in getSortedByName:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function addMusicGenre(req: MusicGenreRequest, res: Response): Promise<Response> {
    const { nameMusicGenre } = req.body;
    const trimmedName = nameMusicGenre?.trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 20) {
        return res.status(400).json({
            success: false,
            message: 'Validation error: NameMusicGenre must be between 2 and 20 characters'
        });
    }

    try {
        const newGenre = await musicGenreService.create(trimmedName);
        return res.status(201)
            .location(`/api/music-genres/${newGenre._id}`)
            .json({
                success: true,
                data: {
                    _id: newGenre._id,
                    NameMusicGenre: newGenre.NameMusicGenre
                }
            });
    } catch (error: any) {
        console.error('Error in addMusicGenre:', error);
        
        if (error.message === 'A music genre with this name already exists') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

async function updateMusicGenre(req: MusicGenreRequest, res: Response): Promise<Response> {
    const { nameMusicGenre } = req.body;
    const genreId = req.params.id;

    if (!genreId || !mongoose.Types.ObjectId.isValid(genreId)) {
        return res.status(400).json({ success: false, message: 'A valid genre ID is required' });
    }

    if (!nameMusicGenre || nameMusicGenre.trim().length < 2 || nameMusicGenre.trim().length > 20) {
        return res.status(400).json({
            success: false,
            message: 'Validation error: NameMusicGenre must be between 2 and 20 characters'
        });
    }

    try {
        const updatedGenre = await musicGenreService.update(genreId, nameMusicGenre.trim());
        if (!updatedGenre) {
            return res.status(404).json({
                success: false,
                message: `MusicGenre with ID ${genreId} not found`
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedGenre
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update music genre';
        console.error('Error in updateMusicGenre:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function deleteMusicGenre(req: MusicGenreRequest, res: Response): Promise<Response> {
    const genreId = req.params.id;

    if (!genreId || !mongoose.Types.ObjectId.isValid(genreId)) {
        return res.status(400).json({ success: false, message: 'A valid genre ID is required' });
    }

    try {
        const hasGroups = await musicGenreService.hasGroups(genreId);
        if (hasGroups) {
            return res.status(400).json({
                success: false,
                message: `The Music Genre with ID ${genreId} cannot be deleted because it has associated Groups`
            });
        }

        const deletedGenre = await musicGenreService.remove(genreId);
        if (!deletedGenre) {
            return res.status(404).json({
                success: false,
                message: `MusicalGenre with ID ${genreId} not found`
            });
        }

        return res.status(200).json({
            success: true,
            data: deletedGenre
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete music genre';
        console.error('Error in deleteMusicGenre:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

export default {
    getMusicGenres,
    getMusicGenreById,
    searchByName,
    getSortedByName,
    addMusicGenre,
    updateMusicGenre,
    deleteMusicGenre
};