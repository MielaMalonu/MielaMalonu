const invites = [
  "la-cueva-de-cosi", "Hgb5rjxaKR", "Ta7mtrADZA", "cyberinfo", "reactionroles",
  "dualview", "emh", "valorantil", "jb", "lgbtqia", "shaun", "moco",
  "polarguild", "gca", "gamersland", "celestials", "titsrp", "valcraft",
  "nico-vip", "GBtkSEbzj5"
];

async function fetchServerData(invite) {
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${invite}?with_counts=true`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    
    const server = data.guild;
    return {
      tag: server.name.split(' ')[0].substring(0, 4).toUpperCase(), // Simple tag logic
      icon: `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`,
      name: server.name,
      memberCount: data.approximate_member_count,
      invite,
      id: server.id
    };
  } catch (err) {
    console.error(`Error fetching invite ${invite}:`, err);
    return null;
  }
}

async function loadServers() {
  const list = document.getElementById("server-list");

  for (const invite of invites) {
    const server = await fetchServerData(invite);
    if (!server) continue;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td><img src="${server.icon}" alt="" width="24" height="24" style="vertical-align:middle; border-radius:50%; margin-right:5px;"> ${server.tag}</td>
      <td>${server.memberCount.toLocaleString()}</td>
      <td>${server.name}</td>
      <td><a href="https://discord.gg/${server.invite}" target="_blank">${server.invite}</a></td>
      <td>${server.id}</td>
    `;
    list.appendChild(row);
  }
}

loadServers();
