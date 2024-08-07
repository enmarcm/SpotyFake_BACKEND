"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LikesModelClass_1 = __importDefault(require("../models/LikesModelClass"));
const SongsModel_1 = __importDefault(require("../models/SongsModel"));
const instances_1 = require("../data/instances");
class LikeController {
    static toggleLikeSong(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { idUser } = req;
                const { idSong } = req.params;
                const response = yield LikesModelClass_1.default.toggleLikeSong({ idUser, idSong });
                console.log(response);
                return res.json(response);
            }
            catch (error) {
                console.error("Error toggling like on song:", error);
                return res.status(500).json({
                    error: `An error occurred while toggling like on song. Error: ${error}`,
                });
            }
        });
    }
    static getLikesByUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { idUser } = req;
                const response = yield LikesModelClass_1.default.getLikesByUser({ idUser });
                const songsLiked = yield Promise.all(response.map((like) => __awaiter(this, void 0, void 0, function* () {
                    const songData = yield SongsModel_1.default.getSongById(like.idSong);
                    return songData;
                })));
                const newValues = yield Promise.all(songsLiked.map((song) => __awaiter(this, void 0, void 0, function* () {
                    const artists = yield Promise.all(song.idArtist.map((artist) => __awaiter(this, void 0, void 0, function* () {
                        const artistData = yield instances_1.ISpotifyAPIManager.getArtistById({ id: artist });
                        return {
                            id: artistData.id,
                            name: artistData.name,
                        };
                    })));
                    return {
                        id: song._id,
                        urlImage: song.urlImage,
                        name: song.name,
                        duration: song.duration,
                        date: song.date,
                        urlSong: song.urlSong,
                        artists,
                        artistName: artists.map((artist) => artist.name),
                        idArtist: song.idArtist,
                    };
                })));
                return res.json(newValues);
            }
            catch (error) {
                console.error("Error getting likes by user:", error);
                return res.status(500).json({
                    error: `An error occurred while getting likes by user. Error: ${error}`,
                });
            }
        });
    }
    static verifySongLikedByUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { idUser } = req;
                const { idSong } = req.params;
                const response = yield LikesModelClass_1.default.verifySongLikedByUser({
                    idUser,
                    idSong,
                });
                return res.json(response);
            }
            catch (error) {
                console.error("Error verifying song liked by user:", error);
                return res.status(500).json({
                    error: `An error occurred while verifying song liked by user. Error: ${error}`,
                });
            }
        });
    }
}
exports.default = LikeController;
