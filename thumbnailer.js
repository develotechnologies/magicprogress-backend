const sharp = require("sharp");

const { promises: fs } = require("fs");
const dir = "D:\\DITS\\magicprogress-backend\\public\\images\\visits";
const dir_new =
	"D:\\DITS\\magicprogress-backend\\public\\images\\visits\\thumbnails";

const getDirFiles = async (dir) => {
	return await fs.readdir(dir);
};

(async () => {
	const res = await getDirFiles(dir);
	await resizeImages(res);
})();

async function resizeImages(files) {
	for (let i = 0; i < files.length; i++) {
		try {
			let imgBuffer = await sharp(`${dir}\\${files[i]}`).toBuffer();
			let thumbnail = await sharp(imgBuffer)
				.resize({
					width: 200,
					fit: "contain",
					background: "white",
				})
				.toBuffer();
			await fs.writeFile(`${dir_new}\\${files[i]}`, thumbnail);
			console.log("Image", i + 1, "of", files.length, "resized!");
		} catch (error) {
			console.log("-Image", i + 1, "of", files.length, "FAILED!");
		}
	}
}
