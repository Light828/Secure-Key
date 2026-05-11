import java.net.InetAddress;

public class DnsProbe {
  public static void main(String[] args) throws Exception {
    InetAddress[] addrs = InetAddress.getAllByName("api.stripe.com");
    System.out.println(addrs.length);
    for (InetAddress addr : addrs) {
      System.out.println(addr.getHostAddress());
    }
  }
}
