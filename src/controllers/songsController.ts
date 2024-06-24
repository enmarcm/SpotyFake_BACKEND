import { Request, Response } from "express";
import SongsModel from "../models/SongsModel";

class SongsController {
  static async getSongByName(req: Request, res: Response) {
    try {
      const { songName } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;

      if (!songName)
        return res.status(400).json({ error: "Song name is required" });

      const songs = await SongsModel.getSongByName({
        name: songName,
        page,
        limit,
      });

      return res.json(songs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: `An error occurred while searching for the song. Error: ${error}`,
      });
    }
  }

  static async addSong(req: Request, res: Response) {
    try {
      const { name, idArtist, idAlbum, duration, urlImage, urlSong, date } =
        req.body as any;

      const { role } = req as any;

      if (role === "user")
        return res
          .status(401)
          .json({ error: "You don't have permission to add a song" });

      //TODO AQUI HAY QUE CAMBIAR LA DURACION
      if (!name || !idArtist || !idAlbum || !duration)
        return res.status(400).json({ error: "All fields are required" });

      const song = await SongsModel.addSong({
        name,
        idArtist,
        idAlbum,
        duration,
        urlSong,
        urlImage,
        date,
      });

      return res.json(song);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: `An error ocurred while adding the song. Error: ${error}`,
      });
    }
  }

  static async getSongsByGenre(req: Request, res: Response) {
    try {
      const { genre } = req.body;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;

      if (!genre) return res.status(400).json({ error: "Genre is required" });

      const songs = await SongsModel.getSongsByGenre({
        genre,
        page,
        limit,
      });

      return res.json(songs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: `An error occurred while searching for the songs. Error: ${error}`,
      });
    }
  }
}

export default SongsController;
