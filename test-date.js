const leads = [{ createdAt: new Date() }, { createdAt: "2023-01-01T00:00:00Z" }];
const now = new Date();
leads.forEach(l => {
  const diffDays = (now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 3600 * 24);
  console.log(diffDays);
});
