export default async function serverSideCall(req, res) {
    res.status(200).json({
      data: {price: 123},
    });
  }