import { Request, Response } from "express";
import SongsModel from "../models/SongsModel";
// import UserModelClass from "../models/UserModelClass";
import { ISpotifyAPIManager } from "../data/instances";
import LikesModelClass from "../models/LikesModelClass";

class SongsController {
  static async getSongByName(req: Request, res: Response) {
    try {
      const { idUser } = req as any;
      const { songName } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      if (!songName)
        return res.status(400).json({ error: "Song name is required" });

      const songs = await SongsModel.getSongByName({
        name: songName,
        page,
        limit,
      });

      const parsedSongs = await Promise.all(songs.map(async (song: any) => {
        const isLiked = await LikesModelClass.verifySongLikedByUser({
          idUser,
          idSong: song._id,
        });
      
        return {
          ...song,
          isLiked,
        };
      }));

      return res.json(parsedSongs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: `An error occurred while searching for the song. Error: ${error}`,
      });
    }
  }

  static async addSong(req: Request, res: Response) {
    try {
      const { name, albumName, duration, urlImage, urlSong, date } =
        req.body as any;

      const { role, idUser, idArtist } = req as any;

      if (role === "user" || !idArtist)
        return res
          .status(401)
          .json({ error: "You don't have permission to add a song" });

      //Obtener id de artista del user
      //TODO AQUI HAY QUE CAMBIAR LA DURACION

      if (!name || !idArtist || !albumName || !duration || !urlSong)
        return res.status(400).json({ error: "All fields are required" });

      const song = await SongsModel.addSong({
        name,
        idArtist,
        albumName,
        duration,
        urlSong,
        urlImage,
        date,
        idUser,
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
      const { genre } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      if (!genre) return res.status(400).json({ error: "Genre is required" });

      const newGenre = [genre];

      const songs = await SongsModel.getSongByGenre({
        genres: newGenre,
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

  static async getSongsByGenre2(req: Request, res: Response) {
    try {
      const { genre } = req.params;
      const page = parseInt(req.query.page as string) || 1;

      if (!genre) return res.status(400).json({ error: "Genre is required" });

      const songs = await ISpotifyAPIManager.getSongByGenre({ genre, page });

      const parsedSongs = songs.map((song: any) => {
        const newValues: any = {
          idSong: song.id,
          name: song.name,
          duration: song.duration_ms,
          urlImage: song.album.images[0].url,
          urlSong:
            song.preview_url ||
            "https://firebasestorage.googleapis.com/v0/b/spotyfake-4453c.appspot.com/o/uploads%2FRingtone.mp3?alt=media&token=f8e9556a-4119-4a9c-b283-f289edc1f731",
          artists: song.artists.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
          })),
        };

        return newValues;
      });

      return res.json(parsedSongs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: `An error occurred while searching for the songs. Error: ${error}`,
      });
    }
  }

  static async deleteSong(req: Request, res: Response) {
    try {
      const { idSong } = req.params;
      const { idUser } = req as any;

      const result = await SongsModel.deleteSong({ idSong, idUser });

      return res.json(result);
    } catch (error) {
      console.error(error);
      throw new Error(
        `An error occurred while deleting the song. Error: ${error}`
      );
    }
  }

  static async getSongById(req: Request, res: Response) {
    try {
      const { idSong } = req.params;
      const { idUser } = req as any;
  
      if (!idSong) {
        return res.status(400).json({ error: "Song id is required" });
      }
  
      let song;
      try {
        song = await SongsModel.getSongById(idSong);
      } catch (dbError) {
        console.error(`Error fetching song from DB: ${dbError}`);
      }
  
      if (!song) {
        try {
          song = await ISpotifyAPIManager.getSongById({ id: idSong });
        } catch (apiError) {
          console.error(`Error fetching song from Spotify API: ${apiError}`);
          return res.status(404).json({ error: "Song not found" });
        }
      }
  
      const artists = await Promise.all(
        (song.idArtist || song.artists).map(async (artist: any) => {
          const artistInfo = await ISpotifyAPIManager.getArtistById({ id: artist.id || artist });
          return {
            id: artistInfo.id,
            name: artistInfo.name,
            followers: artistInfo.followers.total,
            genres: artistInfo.genres,
            urlImage: artistInfo.images[0]?.url,
          };
        })
      );
  
      const mappedSong = {
        id: song._id || song.id,
        urlImage: song.urlImage || song.album.images[0]?.url,
        name: song.name,
        duration: song.duration || song.duration_ms,
        date: song.date || song.album.release_date,
        url_song: song.urlSong || song.preview_url || "https://p.scdn.co/mp3-preview/23de3926689af61772c7ccb7c7110b1f4643ddf4?cid=cfe923b2d660439caf2b557b21f31221",
        artists,
        album: {
          name: song.album?.name || song.name,
          urlImage: song.album?.images[0]?.url || song.urlImage,
          id: song.album?.id || song._id,
          date: song.album?.release_date || song.date,
        },
        isLiked: await LikesModelClass.verifySongLikedByUser({ idUser, idSong: song._id || song.id })
      };
  
      return res.json(mappedSong);
    } catch (error) {
      console.error(`An error occurred while searching for the song. Error: ${error}`);
      return res.status(500).json({
        error: `An error occurred while searching for the song. Error: ${error}`,
      });
    }
  }

  static async getTopSongs(_req: Request, res: Response) {
    try {
      const response = await ISpotifyAPIManager.getTopTracks({});

      return res.json(response);
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the top songs. Error: ${error}`
      );
    }
  }

  static async getTopArtistSongs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ISpotifyAPIManager.getFamousSongByArtistId({ id });

      return res.json(result);
    } catch (error) {
      console.error(
        `An error occurred while fetching the top songs. Error: ${error}`
      );
      throw new Error(
        `An error occurred while fetching the top songs. Error: ${error}`
      );
    }
  }

  static async getGenres(_req: Request, res: Response) {
    try {
      const response = await ISpotifyAPIManager.obtainGenres();
      return res.json(response);
    } catch (error) {
      console.error(`Ocurrio un error en getGenres: ${error}`);
      throw new Error(`Ocurrio un error en getGenres: ${error}`);
    }
  }
}

export default SongsController;
